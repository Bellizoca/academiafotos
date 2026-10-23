import { useState } from 'react';
import { supabase } from './services/supabase';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './App.css';

export default function AcademiaFitApp() {
  const [fotos, setFotos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  
async function registrarShape(origem) {
  if (carregando) return;

  setCarregando(true);
  setMensagem('');

  try {
    // 1. Captura a foto pela câmera ou galeria
    const imagem = await Camera.getPhoto({
      quality: 70,
      resultType: CameraResultType.Uri,
      source: origem,
      allowEditing: true,
      promptLabelHeader: 'Registrar evolução',
      promptLabelPhoto: 'Escolher da galeria',
      promptLabelPicture: 'Tirar foto agora',
      saveToGallery: false,
    });

    if (!imagem?.webPath) {
      setMensagem('Não foi possível carregar a foto.');
      return;
    }

    // 2. Converte a imagem para Blob
    const resposta = await fetch(imagem.webPath);
    const blob = await resposta.blob();

    // 3. Cria um nome único para o arquivo
    const nomeArquivo = `foto-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;

    // 4. Envia a foto para o Supabase Storage
    setMensagem('Enviando foto para a nuvem...');

    const { data, error } = await supabase.storage
      .from('fotos-camera')
      .upload(nomeArquivo, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    // 5. Obtém a URL pública da imagem
    const { data: urlData } = supabase.storage
      .from('fotos-camera')
      .getPublicUrl(data.path);

    const urlPublica = urlData.publicUrl;

    // 6. Salva a URL no estado do React
    const agora = new Date();

    setFotos((lista) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        webPath: urlPublica,
        publicUrl: urlPublica,
        caminhoStorage: data.path,
        data: agora.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        horario: agora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      ...lista,
    ]);

    setMensagem('Foto enviada para o Supabase com sucesso!');
  } catch (erro) {
    console.error('Erro ao capturar ou enviar foto:', erro);

    setMensagem(
      erro?.message || 'Operação cancelada ou falha no envio da foto.'
    );
  } finally {
    setCarregando(false);
  }
}

  function removerFoto(id) {
    setFotos((lista) => lista.filter((foto) => foto.id !== id));
  }

  return (
    <main className="fit-app" id="inicio">
      <aside className="side-rail">
        <a className="logo-mark" href="#inicio" aria-label="Evolução Fitness">EF<span>+</span></a>
        <nav className="rail-nav" aria-label="Navegação principal">
          <a className="rail-link active" href="#inicio" title="Início">⌂</a>
          <a className="rail-link" href="#registro" title="Registrar foto">◎</a>
          <a className="rail-link" href="#historico" title="Histórico">▤</a>
        </nav>
        <div className="rail-bottom">FIT<br/>CLUB</div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>MEU ESPAÇO</span><b>/</b> EVOLUÇÃO</div>
          <div className="profile-chip"><span className="profile-avatar">A</span><span><strong>Meu progresso</strong><small>Jornada fitness</small></span><span className="profile-menu">⌄</span></div>
        </header>

        <section className="welcome-grid">
          <div className="welcome-copy">
            <div className="overline"><span className="overline-dot"/> SEU PROGRESSO, NO SEU RITMO</div>
            <h1>Um dia de cada vez.<br/><em>Uma versão mais forte.</em></h1>
            <p>Seu corpo, sua jornada. Registre os momentos, acompanhe as mudanças e celebre cada passo da sua evolução.</p>
            <div className="capture-actions">
              <button className="primary-button" onClick={() => registrarShape(CameraSource.Camera)} disabled={carregando} type="button">
                <span className="button-camera">◎</span>{carregando ? 'Abrindo...' : 'Tirar foto agora'}<span className="button-arrow">↗</span>
              </button>
              <button className="gallery-button" onClick={() => registrarShape(CameraSource.Photos)} disabled={carregando} type="button">
                <span className="gallery-icon">▧</span>Escolher da galeria
              </button>
            </div>
            <div className="privacy-note"><span>♧</span> Suas fotos são pessoais e ficam nesta sessão.</div>
          </div>
          <div className="hero-art" aria-label="Ilustração abstrata de força e movimento">
            <div className="art-ring ring-one"/><div className="art-ring ring-two"/>
            <div className="art-label label-top">PROGRESSO REAL</div>
            <div className="art-number">01<span>/∞</span></div>
            <div className="art-line"/>
            <div className="art-label label-bottom">CONSTÂNCIA &nbsp; • &nbsp; FOCO</div>
            <div className="art-spark">✳</div>
          </div>
        </section>

        <section className="stats-row" aria-label="Resumo do progresso">
          <article className="stat-card stat-main"><div className="stat-top"><span>FOTOS REGISTRADAS</span><span className="stat-icon">▧</span></div><strong>{String(fotos.length).padStart(2, '0')}</strong><p>momentos da sua jornada</p></article>
          <article className="stat-card"><div className="stat-top"><span>SEU COMPROMISSO</span><span className="stat-icon coral">✦</span></div><strong className="stat-word">Constância</strong><p>é o que transforma intenção em hábito</p></article>
          <article className="quote-card"><span className="quote-mark">“</span><p>Não compare seu capítulo 1 com o capítulo 20 de alguém.</p><span className="quote-caption">FOCO NA SUA JORNADA</span></article>
        </section>

        {mensagem && <div className="notice" role="status" aria-live="polite"><span>✦</span>{mensagem}<button type="button" onClick={() => setMensagem('')} aria-label="Fechar mensagem">×</button></div>}

        <section className="history-section" id="historico">
          <div className="section-title-row"><div><div className="overline section-overline">SUA CAMINHADA</div><h2>Linha do tempo <span>do progresso</span></h2><p>Cada registro é uma lembrança do quanto você está avançando.</p></div><a href="#registro" className="text-link">+ Nova foto</a></div>
          {fotos.length === 0 ? (
            <div className="empty-timeline" id="registro">
              <div className="empty-icon"><span className="empty-sun">✳</span><span className="empty-frame">＋</span></div>
              <div className="empty-copy"><span className="empty-tag">SEU PRIMEIRO PASSO</span><h3>O começo da sua história fica aqui.</h3><p>Adicione uma foto para começar sua linha do tempo. Escolha uma imagem da galeria ou tire uma nova foto para acompanhar sua evolução ao longo do tempo.</p><div className="empty-actions">
                <button className="secondary-button" onClick={() => registrarShape(CameraSource.Camera)} disabled={carregando} type="button">📸 Tirar foto <span>↗</span></button>
                <button className="secondary-gallery" onClick={() => registrarShape(CameraSource.Photos)} disabled={carregando} type="button">▧ Escolher da galeria</button>
              </div></div>
              <div className="empty-side-note">SEM PRESSA.<br/><b>SEM COMPARAÇÃO.</b></div>
            </div>
          ) : (
            <div className="photo-grid" id="registro">{fotos.map((foto, index) => <article className="progress-card" key={foto.id}><div className="photo-wrap"><img src={foto.webPath} alt={`Foto de evolução registrada em ${foto.data}`} /><span className="photo-index">REGISTRO {String(fotos.length - index).padStart(2, '0')}</span></div><div className="photo-meta"><div><span className="photo-date-label">MOMENTO REGISTRADO</span><h3>{foto.data}</h3><p>Adicionado às {foto.horario}</p></div><button type="button" className="delete-photo" onClick={() => removerFoto(foto.id)} aria-label="Remover foto">×</button></div></article>)}</div>
          )}
        </section>

        <footer className="footer"><div className="footer-brand"><span className="footer-logo">EF<span>+</span></span><span>EVOLUÇÃO FITNESS</span></div><p>O importante não é ser melhor que alguém. É ser melhor do que você era ontem.</p><span className="footer-tag">FEITO PARA A SUA JORNADA ↗</span></footer>
      </div>
    </main>
  );
}
