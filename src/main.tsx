import { render } from 'preact';
import './styles.css';

const app = document.getElementById('app')!;
const tvId = new URLSearchParams(window.location.search).get('tv');

// Carrega só o código do modo em uso: TV (computador) ou controle (celular, via QR Code).
if (tvId !== null) {
  import('./remote/RemoteApp').then(({ RemoteApp }) => render(<RemoteApp tvId={tvId} />, app));
} else {
  import('./tv/TvApp').then(({ TvApp }) => render(<TvApp />, app));
}
