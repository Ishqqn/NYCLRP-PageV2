const defaultStaff = [
    {
        id: "100001",
        name: "Example Moderator",
        rank: "Trial Moderator",
        joined: "Sep 26, 2026"
    },

    {
        id: "100002",
        name: "Example Administrator",
        rank: "Administration Team",
        joined: "Sep 26, 2026"
    },

    {
        id: "100003",
        name: "Example Supervisor",
        rank: "Trial Supervisor",
        joined: "Sep 26, 2026"
    }
];


let staff =
    JSON.parse(
        localStorage.getItem("ny_staff") || "null"
    ) || defaultStaff;


let editingId = null;


/* =========================
   SAVE STAFF
========================= */

function saveStaff() {

    localStorage.setItem(
        "ny_staff",
        JSON.stringify(staff)
    );

}


/* =========================
   LOGOUT
========================= */

function logout() {

    alert(
        "Discord logout will be connected when OAuth2 backend is added."
    );

}


/* =========================
   OPEN ADD / EDIT MODAL
========================= */

function openModal(staffId = null) {

    editingId = staffId;

    const modal =
        document.getElementById("modal");

    const title =
        document.getElementById("modalTitle");

    const description =
        document.getElementById("modalDescription");

    const submit =
        document.getElementById("modalSubmit");

    const deleteBtn =
        document.getElementById("deleteStaffBtn");

    const idInput =
        document.getElementById("newId");

    const nameInput =
        document.getElementById("newName");

    const rankInput =
        document.getElementById("newRank");


    /* =========================
       EDIT MODE
    ========================= */

    if (staffId) {

        const member =
            staff.find(
                x => x.id === staffId
            );

        if (!member) {
            return;
        }


        title.textContent =
            "Edit Staff Member";


        description.textContent =
            "Update this staff member's information and rank.";


        submit.textContent =
            "Save Changes";


        deleteBtn.style.display =
            "flex";


        idInput.value =
            member.id;


        nameInput.value =
            member.name;


        rankInput.value =
            member.rank;


        /*
         * Discord ID cannot be changed
         * when editing an existing member.
         */

        idInput.disabled = true;

    }


    /* =========================
       ADD MODE
    ========================= */

    else {

        title.textContent =
            "Add Staff Member";


        description.textContent =
            "Add a staff member to the NYCLRP staff panel.";


        submit.textContent =
            "Add Staff Member";


        deleteBtn.style.display =
            "none";


        idInput.value = "";

        nameInput.value = "";

        rankInput.selectedIndex = 0;


        idInput.disabled = false;

    }


    modal.classList.add("show");


    setTimeout(
        () => nameInput.focus(),
        50
    );

}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

    document
        .getElementById("modal")
        .classList.remove("show");


    editingId = null;


    document
        .getElementById("newId")
        .disabled = false;


    const deleteBtn =
        document.getElementById("deleteStaffBtn");

    if (deleteBtn) {

        deleteBtn.style.display =
            "none";

    }

}


/* =========================
   RENDER STAFF
========================= */

function render(q = "") {

    const rows =
        document.getElementById("rows");


    if (!rows) {
        return;
    }


    const query =
        q.toLowerCase();


    const filtered =
        staff.filter(
            member =>
                (
                    member.name +
                    member.rank +
                    member.id
                )
                .toLowerCase()
                .includes(query)
        );


    rows.innerHTML =
        filtered.map(member => {

            const avatar =
                member.name
                    ? member.name[0].toUpperCase()
                    : "?";


            return `
                <tr>

                    <td>

                        <div class="person">

                            <i>
                                ${escapeHtml(avatar)}
                            </i>

                            <div>

                                <b>
                                    ${escapeHtml(member.name)}
                                </b>

                                <small>
                                    Discord ID:
                                    ${escapeHtml(member.id)}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="tag">
                            ${escapeHtml(member.rank)}
                        </span>

                    </td>


                    <td>

                        <span class="status">
                            ● Active
                        </span>

                    </td>


                    <td>
                        ${escapeHtml(member.joined)}
                    </td>


                    <td>

                        <button
                            class="edit-btn"
                            onclick="openModal('${escapeJs(member.id)}')"
                        >
                            ✎ Edit
                        </button>

                    </td>

                </tr>
            `;

        })
        .join("");


    const total =
        document.getElementById("total");


    if (total) {

        total.textContent =
            filtered.length +
            " member" +
            (filtered.length === 1 ? "" : "s");

    }


    const count =
        document.getElementById("count");


    if (count) {

        count.textContent =
            staff.length;

    }

}


/* =========================
   ADD / EDIT STAFF
========================= */

function addStaff() {

    const id =
        document
            .getElementById("newId")
            .value
            .trim();


    const name =
        document
            .getElementById("newName")
            .value
            .trim();


    const rank =
        document
            .getElementById("newRank")
            .value;


    /* =========================
       VALIDATION
    ========================= */

    if (!id || !name) {

        alert(
            "Enter a Discord ID and username."
        );

        return;

    }


    /* =========================
       EDIT EXISTING MEMBER
    ========================= */

    if (editingId) {

        const member =
            staff.find(
                x => x.id === editingId
            );


        if (!member) {
            return;
        }


        member.name =
            name;


        member.rank =
            rank;

    }


    /* =========================
       ADD NEW MEMBER
    ========================= */

    else {

        const exists =
            staff.some(
                x => x.id === id
            );


        if (exists) {

            alert(
                "A staff member with this Discord ID already exists."
            );

            return;

        }


        staff.push({

            id: id,

            name: name,

            rank: rank,

            joined:
                new Date().toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )

        });

    }


    saveStaff();


    closeModal();


    render(
        document
            .getElementById("search")
            ?.value || ""
    );

}


/* =========================
   DELETE STAFF
========================= */

function deleteStaff() {

    if (!editingId) {
        return;
    }


    const member =
        staff.find(
            x => x.id === editingId
        );


    if (!member) {
        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to remove ${member.name} from the staff panel?`
        );


    if (!confirmed) {
        return;
    }


    staff =
        staff.filter(
            x => x.id !== editingId
        );


    saveStaff();


    closeModal();


    render(
        document
            .getElementById("search")
            ?.value || ""
    );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    return String(value).replace(
        /[&<>'"]/g,
        character => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"

        })[character]
    );

}


/* =========================
   ESCAPE JAVASCRIPT
========================= */

function escapeJs(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}


/* =========================
   PAGE LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const username =
            localStorage.getItem(
                "ny_name"
            ) || "Staff Member";


        const rank =
            localStorage.getItem(
                "ny_rank"
            ) || "New York City Staff";


        document
            .querySelectorAll("#user")
            .forEach(
                element =>
                    element.textContent =
                        username
            );


        document
            .querySelectorAll("#rank")
            .forEach(
                element =>
                    element.textContent =
                        rank
            );


        document
            .querySelectorAll("#avatar")
            .forEach(
                element =>
                    element.textContent =
                        username[0].toUpperCase()
            );


        render();


        const search =
            document.getElementById(
                "search"
            );


        if (search) {

            search.oninput =
                event =>
                    render(
                        event.target.value
                    );

        }


        const time =
            document.getElementById(
                "time"
            );


        if (time) {

            time.textContent =
                new Date().toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }

    }
);
