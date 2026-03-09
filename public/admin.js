const form = document.getElementById("member-form");
const qrPreview = document.getElementById("qr-preview");
const membersListEl = document.getElementById("members-list");
const statusEl = document.getElementById("form-status");
const downloadBtn = document.getElementById("download-qr");
let latestQrDataUrl = "";
let latestQrFileName = "aucssm-member-qr.png";

function setFormStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#fecaca" : "#9ca3af";
}

async function loadMembers() {
  if (!membersListEl) return;
  try {
    const res = await fetch("/api/admin/members");
    if (!res.ok) {
      throw new Error("Failed to load members");
    }
    const data = await res.json();
    const members = data.members || [];
    if (!members.length) {
      membersListEl.textContent = "No members created yet.";
      membersListEl.classList.add("muted");
      return;
    }
    membersListEl.classList.remove("muted");
    membersListEl.innerHTML = "";
    members.forEach((m) => {
      const row = document.createElement("div");
      row.className = "member-row";
      row.innerHTML = `
        <div class="member-main">${m.name}</div>
        <div class="member-meta">
          ${m.rollNumber} • ${m.department} • ${m.designation} • ${m.session}
        </div>
      `;
      const delBtn = document.createElement("button");
      delBtn.className = "danger-btn";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async () => {
        if (!window.confirm(`Delete member ${m.name}?`)) return;
        try {
          const resDel = await fetch(
            `/api/admin/members/${encodeURIComponent(m.id)}`,
            { method: "DELETE" }
          );
          if (!resDel.ok) {
            throw new Error("Delete failed");
          }
          loadMembers();
        } catch (err) {
          alert(err.message || String(err));
        }
      });
      row.appendChild(delBtn);
      membersListEl.appendChild(row);
    });
  } catch (err) {
    membersListEl.textContent = err.message || String(err);
    membersListEl.classList.add("muted");
  }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      rollNumber: formData.get("rollNumber"),
      department: formData.get("department"),
      designation: formData.get("designation"),
      session: formData.get("session"),
    };

    setFormStatus("Creating member and generating QR...");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create member");
      }
      const data = await res.json();
      const { member, qrDataUrl, qrUrl } = data;
      latestQrDataUrl = qrDataUrl;
      latestQrFileName = `${member.rollNumber}-qr.png`;

      if (qrPreview) {
        qrPreview.classList.remove("muted");
        qrPreview.innerHTML = `
          <div>
            <p><strong>${member.name}</strong></p>
            <p class="muted small-text">${qrUrl}</p>
            <img src="${qrDataUrl}" alt="QR code for ${member.name}" />
          </div>
        `;
      }

      if (downloadBtn) {
        downloadBtn.disabled = false;
      }

      form.reset();
      setFormStatus("Member created successfully.");
      loadMembers();
    } catch (err) {
      setFormStatus(err.message || String(err), true);
    }
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    if (!latestQrDataUrl) return;
    const link = document.createElement("a");
    link.href = latestQrDataUrl;
    link.download = latestQrFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

loadMembers();

