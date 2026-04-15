const rollForm = document.getElementById("roll-form");
const rollInput = document.getElementById("roll-input");
const rollResult = document.getElementById("roll-result");
const verifyBtn = document.getElementById("verify-btn");
const clearBtn = document.getElementById("clear-btn");

function setRollStatus(message, isError = false) {
  if (!rollResult) return;
  rollResult.textContent = message;
  rollResult.classList.toggle("error-text", isError);
  rollResult.classList.toggle("muted", !isError);
}

async function verifyByRoll(rollNumber) {
  const trimmed = rollNumber.trim();
  if (!trimmed) {
    setRollStatus("Please enter a roll number.", true);
    return;
  }

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";
  }
  setRollStatus("Verifying...");

  try {
    const res = await fetch(
      `/api/members/by-roll/${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) {
      throw new Error("Member not found");
    }
    const data = await res.json();
    const member = data.member;
    const issued = new Date(member.createdAt);
    const issuedText = Number.isNaN(issued.getTime())
      ? ""
      : issued.toLocaleString();

    if (!rollResult) return;
    rollResult.innerHTML = `
      <p><strong>${member.name}</strong></p>
      <p class="muted">
        Roll: ${member.rollNumber}<br/>
        Department: ${member.department}<br/>
        Designation: ${member.designation}<br/>
        Session: ${member.session}<br/>
        ${issuedText ? `Issued on: ${issuedText}` : ""}
      </p>
    `;
  } catch (err) {
    setRollStatus(
      err.message || "Member not found. Card may be invalid or revoked.",
      true
    );
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify";
    }
  }
}

if (rollForm && rollInput) {
  rollForm.addEventListener("submit", (event) => {
    event.preventDefault();
    verifyByRoll(rollInput.value);
  });
}

if (clearBtn && rollInput && rollResult) {
  clearBtn.addEventListener("click", () => {
    rollInput.value = "";
    rollInput.focus();
    rollResult.textContent = "Enter a roll number to verify a member.";
    rollResult.classList.remove("error-text");
    rollResult.classList.add("muted");
  });
}

