import { Features } from "../../components/marketing/Features";
import { Footer } from "../../components/marketing/Footer";
import { Hero } from "../../components/marketing/Hero";
import { LoginCards } from "../../components/marketing/LoginCards";
import { TransactionsShowcase } from "../../components/marketing/TransactionsShowcase";

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Hero />
      <LoginCards />
      <TransactionsShowcase />
      <Features />
      <Footer />
    </div>
  );
}

export default LandingPage;
