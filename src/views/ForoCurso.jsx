import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GLOBAL } from '../services/apiConfig';
import { showError, showWarning } from '../utils/alerts';
import '../assets/styles/components/_forocurso.scss';

//Colores de avatar para distinguir estudiantes
const STUDENT_COLORS = [
  { bg: '#faeeda', color: '#633806' },
  { bg: '#e1f5ee', color: '#085041' },
  { bg: '#eeedfe', color: '#3c3489' },
  { bg: '#fbeaf0', color: '#72243e' },
  { bg: '#eaf3de', color: '#27500a' },
];

const TIPO_ICONO = {
  anuncio: '📢',
  tarea: '📋',
  pregunta: '❓',
  material: '📚',
};

function getInitials(nombre = '') {
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function formatHour(fechaStr) {
  const d = new Date(fechaStr);
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

function formatDate(fechaStr) {
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

// Agrupa mensajes consecutivos del mismo autor
function groupMessages(msgs) {
  const groups = [];
  msgs.forEach((msg) => {
    const last = groups[groups.length - 1];
    const autorId = msg.autor?._id || msg.autor_id;
    const lastAutorId = last?.autor_id;
    if (last && lastAutorId === autorId) {
      last.bubbles.push(msg);
    } else {
      groups.push({
        autor_id: autorId,
        autor: msg.autor?.nombre || msg.autor,
        es_tutor: msg.es_tutor,
        bubbles: [msg]
      });
    }
  });
  return groups;
}

export const ForoCurso = () => {
  const API_URL = GLOBAL[0].BASE_URL;
  const { cursoId } = useParams();

  // Datos del usuario actual desde localStorage
  const currentUserId = localStorage.getItem('ID');
  const currentUserName = localStorage.getItem('NAME') || 'Tú';
  const token = localStorage.getItem('TOKEN');

  // ── Estado principal
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [courseInfo, setCourseInfo] = useState({ nombre: 'Cargando...', tutor: '' });
  const [esTutor, setEsTutor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Modal nuevo hilo
  const [showNewThread, setShowNewThread] = useState(false);
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const colorCache = useRef({});

  // ── Headers reutilizables ─────────────────────────────────────────────────
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ── Carga inicial: info del curso e hilos ─────────────────────────────────
  useEffect(() => {
    if (!cursoId) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Info del curso
        const courseRes = await fetch(`${API_URL}/course/${cursoId}`, {
          headers: authHeaders
        });

        if (!courseRes.ok) throw new Error('No se pudo cargar el curso');

        const courseData = await courseRes.json();
        setCourseInfo({
          nombre: courseData.nombre,
          tutor: courseData.nombre_tutor
        });
        setEsTutor(courseData.id_tutor === currentUserId);

        // 2. Hilos del foro
        const threadsRes = await fetch(`${API_URL}/entry/${cursoId}`, {
          headers: authHeaders
        });

        if (!threadsRes.ok) throw new Error('No se pudieron cargar los hilos');

        const threadsData = await threadsRes.json();

        const adaptedThreads = threadsData.map(entry => ({
          _id: entry._id,
          titulo: entry.contenido.substring(0, 60) + (entry.contenido.length > 60 ? '...' : ''),
          contenido: entry.contenido,
          tipo: 'anuncio',
          autor: entry.autor?.nombre || '',
          autor_id: entry.autor?._id || '',
          fecha: entry.createdAt,
          respuestas: 0,
          es_tutor_autor: courseData.id_tutor === (entry.autor?._id || '')
        }));

        setThreads(adaptedThreads);

        if (adaptedThreads.length > 0) {
          setSelectedThread(adaptedThreads[0]);
          fetchMessages(adaptedThreads[0]._id, courseData.id_tutor);
        }

      } catch (error) {
        console.error('Error cargando datos del foro:', error);
        showError({
          title: 'Error al cargar el foro',
          text: 'No se pudieron cargar los datos del curso.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [cursoId, currentUserId]);

  // ── Auto-scroll al último mensaje ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Obtener mensajes de un hilo ───────────────────────────────────────────
  const fetchMessages = async (entryId, tutorId) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/comment/${cursoId}/${entryId}`, {
        headers: authHeaders
      });

      if (!res.ok) throw new Error('No se pudieron cargar los mensajes');

      const data = await res.json();

      const adapted = data.map(comment => ({
        _id: comment._id,
        autor: comment.autor?.nombre || '',
        autor_id: comment.autor?._id || '',
        // Es tutor si su ID coincide con el id_tutor del curso
        es_tutor: (comment.autor?._id || '') === tutorId,
        contenido: comment.contenido,
        fecha: comment.createdAt,
      }));

      setMessages(adapted);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      showError({
        title: 'Error',
        text: 'No se pudieron cargar los mensajes.',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Seleccionar hilo ──────────────────────────────────────────────────────
  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setMessages([]);
    // Pasamos el autor_id del curso como tutorId para identificar mensajes del tutor
    fetchMessages(thread._id, threads.find(t => t.es_tutor_autor)?.autor_id || '');
  };

  // ── Enviar comentario ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const texto = newMessage.trim();
    if (!texto || !selectedThread || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/comment/${cursoId}/${selectedThread._id}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ contenido: texto })
      });

      if (!res.ok) throw new Error('No se pudo enviar el mensaje');

      const newComment = await res.json();

      const adapted = {
        _id: newComment._id,
        autor: newComment.autor?.nombre || currentUserName,
        autor_id: newComment.autor?._id || currentUserId,
        es_tutor: esTutor,
        contenido: newComment.contenido,
        fecha: newComment.createdAt,
      };

      setMessages(prev => [...prev, adapted]);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setThreads(prev => prev.map(t =>
        t._id === selectedThread._id
          ? { ...t, respuestas: t.respuestas + 1 }
          : t
      ));

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      showError({
        title: 'Error',
        text: 'No se pudo enviar el mensaje.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // ── Crear nuevo hilo (solo tutor) ─────────────────────────────────────────
  const handleCreateThread = async () => {
    if (!nuevoContenido.trim()) {
      showWarning({
        title: 'Campo vacío',
        text: 'El contenido del hilo no puede estar vacío.',
      });
      return;
    }

    setCreatingThread(true);
    try {
      const res = await fetch(`${API_URL}/entry/${cursoId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ contenido: nuevoContenido.trim() })
      });

      if (!res.ok) throw new Error('No se pudo crear el hilo');

      const newEntry = await res.json();

      const adaptedThread = {
        _id: newEntry._id,
        titulo: newEntry.contenido.substring(0, 60) + (newEntry.contenido.length > 60 ? '...' : ''),
        contenido: newEntry.contenido,
        tipo: 'anuncio',
        autor: newEntry.autor?.nombre || currentUserName,
        autor_id: newEntry.autor?._id || currentUserId,
        fecha: newEntry.createdAt,
        respuestas: 0,
        es_tutor_autor: true
      };

      setThreads(prev => [adaptedThread, ...prev]);
      setSelectedThread(adaptedThread);
      setMessages([]);
      setNuevoContenido('');
      setShowNewThread(false);

    } catch (error) {
      console.error('Error creando hilo:', error);
      showError({
        title: 'Error',
        text: 'No se pudo crear el hilo.',
      });
    } finally {
      setCreatingThread(false);
    }
  };

  // ── Color de avatar por autor_id ──────────────────────────────────────────
  const getStudentColor = (autorId) => {
    if (!colorCache.current[autorId]) {
      const idx = Object.keys(colorCache.current).length % STUDENT_COLORS.length;
      colorCache.current[autorId] = STUDENT_COLORS[idx];
    }
    return colorCache.current[autorId];
  };

  const messageGroups = groupMessages(messages);

  if (loading) {
    return (
      <div className="foro-main-container foro-loading">
        <p>Cargando foro...</p>
      </div>
    );
  }

  return (
    <div className="foro-main-container">

      {/* ── Sidebar ── */}
      <aside className="foro-sidebar">
        <div className="foro-sidebar-header">
          <span className="foro-course-label">Foro del curso</span>
          <h2 className="foro-course-title">{courseInfo.nombre}</h2>
          <span className="foro-tutor-badge">👑 Tutor: {courseInfo.tutor}</span>
        </div>

        <p className="foro-threads-label">Hilos</p>

        <ul className="foro-thread-list">
          {threads.length === 0 ? (
            <li className="foro-thread-empty">No hay hilos aún.</li>
          ) : (
            threads.map(thread => (
              <li
                key={thread._id}
                className={`foro-thread-item ${selectedThread?._id === thread._id ? 'active' : ''}`}
                onClick={() => handleSelectThread(thread)}
              >
                <span className="foro-thread-title">
                  {TIPO_ICONO[thread.tipo] || '💬'} {thread.titulo}
                </span>
                <span className="foro-thread-meta">
                  {thread.autor} · {formatDate(thread.fecha)}
                </span>
              </li>
            ))
          )}
        </ul>

        {esTutor && (
          <button className="foro-new-thread-btn" onClick={() => setShowNewThread(true)}>
            + Nuevo hilo
          </button>
        )}
      </aside>

      {/* ── Área de chat ── */}
      <section className="foro-chat-area">
        {selectedThread ? (
          <>
            <div className="foro-chat-header">
              <div className="foro-chat-header-icon">💬</div>
              <div className="foro-chat-header-info">
                <span className="foro-chat-title">{selectedThread.titulo}</span>
                <span className="foro-chat-sub">
                  {selectedThread.respuestas} {selectedThread.respuestas === 1 ? 'respuesta' : 'respuestas'}
                </span>
              </div>
            </div>

            {selectedThread.es_tutor_autor && (
              <div className="foro-announcement-banner">
                <span>📌</span>
                <p><strong>Anuncio del tutor:</strong> {selectedThread.autor} publicó este hilo.</p>
              </div>
            )}

            <div className="foro-messages-area">
              {loadingMessages ? (
                <p className="foro-empty-thread">Cargando mensajes...</p>
              ) : messageGroups.length === 0 ? (
                <p className="foro-empty-thread">Aún no hay mensajes. ¡Sé el primero en escribir!</p>
              ) : (
                messageGroups.map((group, gi) => {
                  const isMine = group.autor_id === currentUserId;
                  const isTutor = group.es_tutor;
                  const studentColor = !isMine && !isTutor ? getStudentColor(group.autor_id) : null;

                  return (
                    <div key={gi} className={`foro-msg-group ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <span className="foro-msg-sender-name">{group.autor}</span>
                      )}

                      {group.bubbles.map((msg, bi) => (
                        <div key={msg._id} className="foro-msg-row">
                          {!isMine && bi === 0 && (
                            <div
                              className="foro-msg-avatar"
                              style={
                                isTutor
                                  ? { background: '#1a2b4a', color: '#fff' }
                                  : { background: studentColor.bg, color: studentColor.color }
                              }
                            >
                              {getInitials(group.autor)}
                            </div>
                          )}
                          {!isMine && bi > 0 && <div className="foro-msg-avatar-spacer" />}

                          <div className="foro-bubble-wrapper">
                            {isTutor && bi === 0 && (
                              <span className="foro-tutor-tag">👑 Tutor</span>
                            )}
                            <div className={`foro-bubble ${isMine ? 'bubble-mine' : isTutor ? 'bubble-tutor' : 'bubble-student'}`}>
                              {msg.contenido}
                            </div>
                          </div>

                          <span className="foro-msg-time">{formatHour(msg.fecha)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="foro-input-area">
              <textarea
                ref={textareaRef}
                className="foro-input-box"
                placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); autoResize(e); }}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
              />
              <button
                className="foro-send-btn"
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? '...' : 'Enviar'}
              </button>
            </div>
          </>
        ) : (
          <div className="foro-empty-state">
            <p>No hay hilos en este foro todavía.</p>
          </div>
        )}
      </section>

      {/* ── Modal nuevo hilo (tutor) ── */}
      {showNewThread && (
        <div className="foro-modal-overlay" onClick={() => setShowNewThread(false)}>
          <div className="foro-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo hilo</h3>
            <label>Contenido del anuncio</label>
            <textarea
              value={nuevoContenido}
              onChange={(e) => setNuevoContenido(e.target.value)}
              placeholder="Escribe el contenido del hilo..."
              rows={4}
              autoFocus
            />
            <div className="foro-modal-actions">
              <button className="foro-modal-cancel" onClick={() => setShowNewThread(false)}>
                Cancelar
              </button>
              <button
                className="foro-modal-create"
                onClick={handleCreateThread}
                disabled={creatingThread}
              >
                {creatingThread ? 'Creando...' : 'Crear hilo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForoCurso;