import csv
from io import StringIO
from typing import List


def export_csv(data: List[dict]) -> str:
    if not data:
        return ""

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue()


def export_pdf(html: str) -> bytes:
    # Placeholder: replace with weasyprint or reportlab when PDF rendering is added.
    return html.encode("utf-8")
