import { OrdersPage } from "./pages/OrdersPage";

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>LoomLine</h1>
        <p>Production orders</p>
      </header>
      <main className="app__main">
        <OrdersPage />
      </main>
    </div>
  );
}
