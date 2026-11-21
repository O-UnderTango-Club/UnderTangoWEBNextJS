"use client";

import { useEffect, useState } from "react";

const endpoint = "/api/pe-na-pista/documentos";
const storageKey = "pe-na-pista-contador-acesso";
const maxPdf = 4 * 1024 * 1024;

async function requestDrive(invite, code, file) {
  const headers = { Authorization: "Bearer " + invite };
  if (file) headers["X-Document-Code"] = code;
  const response = await fetch(endpoint, { method: "POST", headers, body: file });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(result.received)) {
    throw new Error(result.error || "Serviço indisponível. Tente novamente.");
  }
  return result.received;
}

function UploadItem({ item, invite, received, onReceipt }) {
  const [ref, title, description] = item;
  const code = ref.split(" ")[0];
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event) {
    event.preventDefault();
    if (!file || sending) return;
    if (file.size > maxPdf) {
      setMessage("O PDF deve ter até 4 MB.");
      return;
    }
    setSending(true);
    setMessage("");
    const form = event.currentTarget;
    try {
      onReceipt(await requestDrive(invite, code, file));
      form.reset();
      setFile(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  const label = id => id + " — " + code;

  return (
    <details className="upload-item">
      <summary>
        <span className="item-body">
          <span className="ref">{ref}</span>
          <strong>{title}</strong>
          <span className={received ? "received-label" : "upload-label"}>
            {received ? "✓ Recebido no Google Drive" : invite ? "＋ Anexar PDF" : "Ver detalhes"}
          </span>
        </span>
      </summary>
      <div className="upload-content">
        <p>{description}</p>
        {!!invite && (
          <form onSubmit={upload}>
            <label htmlFor={"pdf-" + code}>{received ? "Enviar uma nova versão em PDF (até 4 MB)" : "Selecione o PDF (até 4 MB)"}</label>
            <input id={"pdf-" + code} type="file" accept=".pdf,application/pdf" disabled={sending}
              onChange={(event) => { setFile(event.target.files[0] || null); setMessage(""); }} />
            <button type="submit" className="primary" aria-label={label("Enviar PDF")} disabled={!file || sending}>
              {sending ? "Enviando…" : "Enviar PDF"}
            </button>
            <div role="status">{message}</div>
          </form>
        )}
      </div>
    </details>
  );
}

export default function DocumentChecklist({ enabled, groups }) {
  const [invite, setInvite] = useState("");
  const [received, setReceived] = useState([]);
  const [status, setStatus] = useState("");

  function addReceipt(codes) {
    setReceived((previous) => [...new Set([...previous, ...codes])]);
  }

  useEffect(() => {
    if (!enabled) return;
    const fromLink = new URLSearchParams(window.location.hash.slice(1)).get("acesso");
    let fromSession;
    try { fromSession = sessionStorage.getItem(storageKey); } catch {}
    const token = fromLink || fromSession;
    if (!token) return;

    setStatus("Consultando os arquivos recebidos…");
    let active = true;
    requestDrive(token)
      .then((codes) => {
        if (!active) return;
        setInvite(token);
        addReceipt(codes);
        setStatus("");
        try {
          sessionStorage.setItem(storageKey, token);
          if (fromLink) window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch {}
      })
      .catch((error) => { if (active) setStatus(error.message); });
    return () => { active = false; };
  }, [enabled]);

  return (
    <>
      <p className="upload-status" role="status">
        {status || (invite
          ? received.length + " de " + groups.reduce((count, group) => count + group.items.length, 0) + " itens com PDF recebido. Clique em um item para anexar um arquivo."
          : enabled ? "Para anexar um PDF, abra o link de envio que Pablo compartilhou com você." : "Confira a lista abaixo. O envio por e-mail ou WhatsApp está disponível nesta página.")}
      </p>
      {groups.map(({ title, description, items }) => (
        <div key={title} className="group">
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="list">
            {items.map((item) => (
              <UploadItem key={item[0]} item={item} invite={invite}
                received={received.includes(item[0].split(" ")[0])} onReceipt={addReceipt} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
