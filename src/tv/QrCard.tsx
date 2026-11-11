import { QrCode } from 'lucide-preact';
import QRCodeLib from 'qrcode';
import { useEffect, useState } from 'preact/hooks';
import { siteUrl } from '../config';
import { hostStatus, hostTvId } from '../lib/host-bridge';

export function QrCard() {
  const status = hostStatus.value;
  const tvId = hostTvId.value;
  const [svg, setSvg] = useState('');

  useEffect(() => {
    if (status !== 'ready') return;
    const url = `${siteUrl()}?tv=${encodeURIComponent(tvId)}`;
    QRCodeLib.toString(url, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [status, tvId]);

  return (
    <div class="shrink-0 border-t border-white/[0.06] px-5 py-5">
      <div class="flex flex-col items-center gap-3">
        {status === 'ready' && svg ? (
          <div
            class="size-[148px] rounded-xl bg-white p-2.5 [&>svg]:size-full"
            role="img"
            aria-label="QR Code para adicionar músicas pelo celular"
            // SVG gerado localmente pela biblioteca qrcode a partir da URL do site
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div class="flex size-[148px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 text-center">
            <QrCode size={28} class={`text-neutral-600 ${status === 'connecting' ? 'animate-pulse' : ''}`} aria-hidden="true" />
            <span class="text-[11px] leading-snug text-neutral-500">
              {status === 'disabled'
                ? 'Configure o Firebase para ativar'
                : status === 'connecting'
                  ? 'Conectando…'
                  : 'Sem conexão. Recarregue a página.'}
            </span>
          </div>
        )}
        <p class="text-sm font-semibold text-neutral-200">Adicionar música na fila</p>
      </div>
    </div>
  );
}
