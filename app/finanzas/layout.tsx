import "./finance-reset.css";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="finance-page-scope">{children}</div>;
}
