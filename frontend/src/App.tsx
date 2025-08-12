import { type Component } from 'solid-js';
import FiltersPanel from './components/filters/FiltersPanel';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import AmrTable from './components/table/AmrTableContainer';
import './App.css';

const App: Component = () => {
  return (
    <div class="app-container">
      <Header></Header>
      <main>
        <FiltersPanel></FiltersPanel>
        <AmrTable></AmrTable>
      </main>
      <Footer></Footer>
    </div>
  );
};

export default App;
