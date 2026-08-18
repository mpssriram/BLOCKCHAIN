from __future__ import annotations

from datetime import date
import os
from typing import Any

import pandas as pd
import streamlit as st

from api_client import BackendApiError, PayrollApi


st.set_page_config(
    page_title="PayStream Operations",
    page_icon=":material/account_balance:",
    layout="wide",
    initial_sidebar_state="expanded",
)

DEFAULT_API_URL = os.environ.get("PAYSTREAM_API_URL", "http://127.0.0.1:8000")


def init_state() -> None:
    st.session_state.setdefault("api_url", DEFAULT_API_URL)
    st.session_state.setdefault("access_token", None)
    st.session_state.setdefault("account_email", "")


def api() -> PayrollApi:
    return PayrollApi(st.session_state.api_url, st.session_state.access_token)


def show_error(exc: BackendApiError) -> None:
    st.error(str(exc))


def as_frame(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def money(value: Any) -> str:
    try:
        return f"Rs {float(value or 0):,.2f}"
    except (TypeError, ValueError):
        return "Rs 0.00"


def rerun() -> None:
    st.rerun()


def login_screen() -> None:
    left, center, right = st.columns([1, 1.25, 1])
    with center:
        st.title("PayStream Operations")
        st.caption("Employer and administrator workspace")
        with st.form("sign_in"):
            api_url = st.text_input("FastAPI URL", value=st.session_state.api_url)
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign in", type="primary", use_container_width=True)

        if submitted:
            try:
                client = PayrollApi(api_url)
                payload = client.login(email.strip(), password)
                st.session_state.api_url = api_url.rstrip("/")
                st.session_state.access_token = payload["access_token"]
                st.session_state.account_email = email.strip()
                rerun()
            except (BackendApiError, KeyError) as exc:
                show_error(exc if isinstance(exc, BackendApiError) else BackendApiError("Login response did not include an access token."))


def load_dashboard() -> dict[str, Any]:
    client = api()
    return {
        "payout": client.get("/api/dashboard/total-payout"),
        "tax": client.get("/api/dashboard/total-tax"),
        "streams": client.get("/api/dashboard/active-streams"),
        "earners": client.get("/api/dashboard/top-earners"),
        "monthly": client.get("/api/dashboard/monthly-summary"),
        "treasury": client.get("/api/treasury/summary"),
    }


def dashboard_page() -> None:
    st.title("Payroll overview")
    st.caption("Backend-recorded payroll reporting and treasury readiness.")
    try:
        data = load_dashboard()
    except BackendApiError as exc:
        show_error(exc)
        return

    treasury = data["treasury"] or {}
    health = treasury.get("health") or {}
    metrics = st.columns(4)
    metrics[0].metric("Total payout", money((data["payout"] or {}).get("total_paid_net")))
    metrics[1].metric("Total tax", money((data["tax"] or {}).get("total_tax_collected")))
    metrics[2].metric("Active streams", int((data["streams"] or {}).get("active_streams", 0)))
    metrics[3].metric("Treasury balance", money((treasury.get("treasury") or {}).get("total_balance")))

    chart_col, earner_col = st.columns([1.35, 1])
    with chart_col:
        st.subheader("Monthly payroll flow")
        monthly = data["monthly"] or []
        if monthly:
            frame = as_frame(monthly).set_index("month")
            available = [column for column in ("net", "tax") if column in frame.columns]
            if available:
                st.line_chart(frame[available], use_container_width=True)
            else:
                st.info("The backend returned no chartable monthly values.")
        else:
            st.info("No monthly payroll records yet.")
    with earner_col:
        st.subheader("Top earners")
        earners = data["earners"] or []
        if earners:
            earner_frame = as_frame(earners)
            columns = [column for column in ("name", "total_net") if column in earner_frame.columns]
            st.dataframe(earner_frame[columns], hide_index=True, use_container_width=True)
        else:
            st.info("No payout records yet.")

    st.subheader("Treasury health")
    health_cols = st.columns(3)
    health_cols[0].metric("Status", str(health.get("status", "unknown")).title())
    health_cols[1].metric("Runway", f"{float(health.get('runway_sec') or 0) / 86400:.1f} days")
    health_cols[2].metric("Recorded activity", int(treasury.get("recent_transactions") or 0))


def employees_page() -> None:
    st.title("Employees")
    try:
        employees = api().get("/api/employees/") or []
    except BackendApiError as exc:
        show_error(exc)
        return

    action_col, create_col = st.columns([1.4, 1])
    with create_col:
        with st.expander("Add employee"):
            with st.form("create_employee", clear_on_submit=True):
                name = st.text_input("Name")
                email = st.text_input("Email")
                role = st.text_input("Job role", value="employee")
                if st.form_submit_button("Create employee", type="primary"):
                    try:
                        api().post("/api/employees/", payload={"name": name, "email": email, "role": role})
                        st.success("Employee created.")
                        rerun()
                    except BackendApiError as exc:
                        show_error(exc)

    with action_col:
        query = st.text_input("Search employees", placeholder="Name, email, or role")
        if query:
            needle = query.lower()
            employees = [
                employee
                for employee in employees
                if needle in " ".join(str(employee.get(key, "")) for key in ("name", "email", "role")).lower()
            ]
        display = as_frame(employees)
        if not display.empty:
            st.dataframe(display, hide_index=True, use_container_width=True)
        else:
            st.info("No employees match this search.")

    if not employees:
        return
    by_label = {f"{employee['name']} ({employee['email']})": employee for employee in employees}
    selected = st.selectbox("Manage employee", list(by_label))
    employee = by_label[selected]
    employee_id = int(employee["id"])
    st.divider()

    profile_col, payroll_col, stream_col = st.columns(3)
    with profile_col:
        st.subheader("Profile")
        with st.form(f"profile_{employee_id}"):
            wallet = st.text_input("Wallet address", value=employee.get("wallet_address") or "")
            use_custom_tax = st.checkbox("Use custom tax rate", value=bool(employee.get("use_custom_tax")))
            tax_rate = st.number_input(
                "Custom tax rate (%)", min_value=0.0, max_value=100.0,
                value=float(employee.get("custom_tax_rate") or 0), step=0.5,
            )
            if st.form_submit_button("Save profile", type="primary"):
                try:
                    client = api()
                    client.put(f"/api/employees/{employee_id}/wallet", payload={"wallet_address": wallet or None})
                    client.put(
                        f"/api/employees/{employee_id}/tax",
                        payload={"use_custom_tax": use_custom_tax, "custom_tax_rate": tax_rate if use_custom_tax else None},
                    )
                    st.success("Profile updated.")
                    rerun()
                except BackendApiError as exc:
                    show_error(exc)
    with payroll_col:
        st.subheader("Record payroll")
        with st.form(f"salary_{employee_id}", clear_on_submit=True):
            amount = st.number_input("Salary amount", min_value=0.01, step=100.0)
            description = st.text_input("Description", value="Salary payout")
            if st.form_submit_button("Record salary"):
                try:
                    api().post("/api/transactions/", payload={"employee_id": employee_id, "amount": amount, "description": description})
                    st.success("Salary recorded.")
                except BackendApiError as exc:
                    show_error(exc)
        with st.form(f"bonus_{employee_id}", clear_on_submit=True):
            bonus_amount = st.number_input("Bonus amount", min_value=0.01, step=100.0)
            reason = st.text_input("Bonus reason")
            if st.form_submit_button("Record bonus"):
                try:
                    api().post(f"/api/bonuses/{employee_id}", payload={"amount": bonus_amount, "reason": reason})
                    st.success("Bonus recorded.")
                except BackendApiError as exc:
                    show_error(exc)
    with stream_col:
        st.subheader("Stream state")
        st.caption("These buttons update backend stream records. Contract wallet actions remain in the employee portal.")
        start, pause, cancel = st.columns(3)
        actions = (
            (start, "Start", "start", "started"),
            (pause, "Pause", "pause", "paused"),
            (cancel, "Cancel", "cancel", "cancelled"),
        )
        for column, label, action, result in actions:
            if column.button(label, key=f"{action}_{employee_id}", use_container_width=True):
                try:
                    api().post(f"/api/stream/{action}/{employee_id}")
                    st.success(f"Stream {result}.")
                    rerun()
                except BackendApiError as exc:
                    show_error(exc)
        if employee.get("is_active", True) and st.button("Deactivate employee", key=f"deactivate_{employee_id}"):
            try:
                api().patch(f"/api/employees/{employee_id}/deactivate")
                st.success("Employee deactivated.")
                rerun()
            except BackendApiError as exc:
                show_error(exc)


def treasury_page() -> None:
    st.title("Treasury")
    try:
        summary = api().get("/api/treasury/summary") or {}
    except BackendApiError as exc:
        show_error(exc)
        return

    treasury = summary.get("treasury") or {}
    health = summary.get("health") or {}
    stats = st.columns(4)
    stats[0].metric("Backend balance", money(treasury.get("total_balance")))
    stats[1].metric("Recorded on-chain balance", money(treasury.get("onchain_balance")))
    stats[2].metric("Health", str(health.get("status", "unknown")).title())
    stats[3].metric("Active streams", int(summary.get("active_streams") or 0))

    st.info("Contract balance sync is not shown here because the existing backend sync endpoint is not implemented yet. The contract remains the source of truth for on-chain funds.")
    deposit_col, withdraw_col = st.columns(2)
    with deposit_col:
        with st.form("treasury_deposit", clear_on_submit=True):
            amount = st.number_input("Deposit amount", min_value=0.01, step=100.0, key="deposit_amount")
            if st.form_submit_button("Record deposit", type="primary"):
                try:
                    api().post("/api/treasury/deposit", payload={"amount": amount})
                    st.success("Treasury deposit recorded.")
                    rerun()
                except BackendApiError as exc:
                    show_error(exc)
    with withdraw_col:
        with st.form("treasury_withdraw", clear_on_submit=True):
            amount = st.number_input("Withdrawal amount", min_value=0.01, step=100.0, key="withdraw_amount")
            if st.form_submit_button("Record withdrawal"):
                try:
                    api().post("/api/treasury/withdraw", payload={"amount": amount})
                    st.success("Treasury withdrawal recorded.")
                    rerun()
                except BackendApiError as exc:
                    show_error(exc)


def reports_page() -> None:
    st.title("Reports")
    report_date = st.date_input("Reporting month", value=date.today(), format="YYYY-MM-DD")
    try:
        monthly = api().get("/api/reports/monthly", params={"year": report_date.year, "month": report_date.month})
        tax = api().get("/api/reports/tax", params={"year": report_date.year, "month": report_date.month})
    except BackendApiError as exc:
        show_error(exc)
        return

    total_payout = float(monthly.get("total_payout") or 0)
    total_tax = float(monthly.get("total_tax") or 0)
    metrics = st.columns(3)
    metrics[0].metric("Gross payroll", money(total_payout + total_tax))
    metrics[1].metric("Net payout", money(total_payout))
    metrics[2].metric("Tax collected", money(tax.get("total_tax_collected")))
    st.subheader("Employee breakdown")
    breakdown = as_frame(monthly.get("breakdown") or [])
    if breakdown.empty:
        st.info("No payroll records for this month.")
    else:
        st.dataframe(breakdown, hide_index=True, use_container_width=True)
        st.download_button(
            "Download breakdown CSV",
            data=breakdown.to_csv(index=False).encode("utf-8"),
            file_name=f"payroll-{report_date.year}-{report_date.month:02d}.csv",
            mime="text/csv",
        )
    with st.expander("Tax configuration used by the backend"):
        st.json(tax)


def settings_page() -> None:
    st.title("Tax settings")
    try:
        client = api()
        company_tax = client.get("/api/settings/company-tax") or {}
        slabs = client.get("/api/settings/tax-slabs") or []
    except BackendApiError as exc:
        show_error(exc)
        return

    with st.form("company_tax"):
        rate = st.number_input("Default tax rate (%)", min_value=0.0, max_value=100.0, value=float(company_tax.get("default_tax_rate") or 0), step=0.5)
        if st.form_submit_button("Save default rate", type="primary"):
            try:
                api().post("/api/settings/company-tax", payload={"default_tax_rate": rate})
                st.success("Default tax rate updated.")
                rerun()
            except BackendApiError as exc:
                show_error(exc)
    st.subheader("Tax slabs")
    st.dataframe(as_frame(slabs), hide_index=True, use_container_width=True)
    with st.expander("Add tax slab"):
        with st.form("add_slab", clear_on_submit=True):
            min_income = st.number_input("Minimum income", min_value=0.0, step=1000.0)
            has_max = st.checkbox("Set a maximum income")
            max_income = st.number_input("Maximum income", min_value=min_income, step=1000.0, disabled=not has_max)
            slab_rate = st.number_input("Tax rate (%)", min_value=0.0, max_value=100.0, step=0.5)
            if st.form_submit_button("Add slab"):
                try:
                    api().post("/api/settings/tax-slabs", payload={"min_income": min_income, "max_income": max_income if has_max else None, "tax_rate": slab_rate})
                    st.success("Tax slab added.")
                    rerun()
                except BackendApiError as exc:
                    show_error(exc)


def app() -> None:
    init_state()
    if not st.session_state.access_token:
        login_screen()
        return

    with st.sidebar:
        st.title("PayStream")
        st.caption(st.session_state.account_email)
        page = st.radio("Workspace", ("Overview", "Employees", "Treasury", "Reports", "Settings"), label_visibility="collapsed")
        if st.button("Sign out", use_container_width=True):
            st.session_state.access_token = None
            st.session_state.account_email = ""
            rerun()

    pages = {
        "Overview": dashboard_page,
        "Employees": employees_page,
        "Treasury": treasury_page,
        "Reports": reports_page,
        "Settings": settings_page,
    }
    pages[page]()


app()
