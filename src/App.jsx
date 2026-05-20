import { GameGrid } from "./components/GameGrid.jsx";
import { Header } from "./components/Header.jsx";
import { Hero } from "./components/Hero.jsx";
import { ContactSection } from "./components/ContactSection.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Hero />
        <GameGrid />
        <ContactSection />
      </main>
    </div>
  );
}
