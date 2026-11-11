import { render } from 'preact';
import './styles.css';

function App() {
  return (
    <main class="grid h-dvh place-items-center">
      <h1 class="text-5xl font-extrabold tracking-tight">Karaokê</h1>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
