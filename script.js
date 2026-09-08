// Google Apps Script web-app URL for Pinesoul Cafe reservations.
const RESERVATION_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzvwpPtKTnhRzhqyrh_XajZ4F8TutW1C2AT0HRO3BX6rXwETGRhTHiT3s779dM3Cm_B/exec";

const menu = [
  {
    name: "Pinesoul Special Chicken",
    category: "Indian Main Course",
    type: "Non-Vegetarian"
  },
  {
    name: "Pinesoul Special Biryani",
    category: "Indian Main Course",
    type: "Non-Vegetarian"
  },
  {
    name: "Grilled Chicken Sizzler",
    category: "Sizzlers",
    type: "Non-Vegetarian"
  },
  {
    name: "Thai Mixed Non-Veg Platter",
    category: "Thai",
    type: "Non-Vegetarian"
  },
  {
    name: "Dragon Chicken",
    category: "Starters",
    type: "Non-Vegetarian"
  }
];

const photos = [
  {src:"Images/dining-room-wide.png.webp", alt:"Pinesoul Cafe dining room with green seating and warm lights", label:"The dining room"},
  {src:"Images/front-seating.png.webp", alt:"Pinesoul Cafe seating viewed from the front", label:"A seat by the window"},
  {src:"Images/dining-room-table.png.webp", alt:"Set dining tables and soft green chairs", label:"Gather around"},
  {src:"Images/warm-wall.png.webp", alt:"Warmly lit interior wall with botanical pattern", label:"After sundown"},
  {src:"Images/private-corner.png.webp", alt:"Quiet corner table with botanical artwork", label:"A quieter corner"}
];

const $ = (selector) => document.querySelector(selector);

document.querySelectorAll("[data-scroll]").forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.dataset.scroll);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior:"smooth", block:"start"});
  });
});

function renderMenu(category = "All") {
  const container = $("#menuItems");
  if (!container) return;

  const items = category === "All" ? menu : menu.filter(item => item.category === category);
  container.innerHTML = items.map(item => `
    <article class="menu-item">
      <div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
      <div class="menu-price">${item.price}</div>
    </article>
  `).join("");
}

function setupFilters() {
  const filters = $("#filters");
  if (!filters) return;

  const categories = ["All", ...new Set(menu.map(item => item.category))];
  filters.innerHTML = categories.map((category, index) =>
    `<button class="filter-button ${index === 0 ? "active" : ""}" type="button">${category}</button>`
  ).join("");

  filters.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
      filters.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      renderMenu(button.textContent);
    });
  });
}

function setupGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;

  grid.innerHTML = photos.map((photo, index) => `
    <button class="gallery-tile" type="button" data-gallery-index="${index}" aria-label="Open ${photo.label}">
      <img src="${photo.src}" alt="${photo.alt}" loading="${index === 0 ? "eager" : "lazy"}">
      <span class="gallery-label">${photo.label}</span>
    </button>
  `).join("");

  grid.querySelectorAll("[data-gallery-index]").forEach(tile => {
    tile.addEventListener("click", () => openLightbox(Number(tile.dataset.galleryIndex)));
  });
}

let currentPhoto = 0;

function openLightbox(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const photo = photos[currentPhoto];
  $("#lightboxImage").src = photo.src;
  $("#lightboxImage").alt = photo.alt;
  $("#lightboxCaption").textContent = photo.label;
  $("#lightboxCount").textContent = `${currentPhoto + 1} / ${photos.length}`;
  $("#lightbox").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  $("#lightbox").hidden = true;
  document.body.style.overflow = "";
}

function setupLightbox() {
  $("#lightboxClose")?.addEventListener("click", closeLightbox);
  $("#lightboxPrev")?.addEventListener("click", () => openLightbox(currentPhoto - 1));
  $("#lightboxNext")?.addEventListener("click", () => openLightbox(currentPhoto + 1));

  $("#lightbox")?.addEventListener("click", e => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  document.addEventListener("keydown", e => {
    if ($("#lightbox")?.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentPhoto - 1);
    if (e.key === "ArrowRight") openLightbox(currentPhoto + 1);
  });
}

function setupReservation() {
  const form = $("#reservationForm");
  if (!form) return;

  const dateInput = form.querySelector('[name="date"]');
  const status = $("#formStatus");
  const button = $("#reservationSubmit");
  const frame = $("#reservationFrame");

  if (dateInput) {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().split("T")[0];
    dateInput.min = localDate;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    if (!frame) {
      console.error("Reservation iframe is missing from index.html");
      status.hidden = false;
      status.className = "form-status error";
      status.textContent = "The reservation form needs one small setup fix. Please refresh the page and try again.";
      return;
    }

    button.disabled = true;
    button.innerHTML = "SENDING REQUEST…";

    status.hidden = false;
    status.className = "form-status";
    status.textContent = "Sending your reservation request…";

    // Send a real browser form POST to Google Apps Script through a hidden iframe.
    // This avoids CORS restrictions from fetch() on a standalone HTML website.
    const postForm = document.createElement("form");
    postForm.method = "POST";
    postForm.action = RESERVATION_ENDPOINT;
    postForm.target = "reservationFrame";
    postForm.style.display = "none";

    for (const [key, value] of new FormData(form).entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      postForm.appendChild(input);
    }

    document.body.appendChild(postForm);

    try {
      postForm.submit();

      // We intentionally do not read the cross-origin iframe response.
      // The POST itself is handled by Apps Script's doPost(e).
      setTimeout(() => {
        status.className = "form-status success";
        status.textContent = "Thank you! Your reservation request has been sent. We’ll review it and confirm your table.";
        form.reset();

        if (dateInput) {
          const today = new Date();
          dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString().split("T")[0];
        }

        button.disabled = false;
        button.innerHTML = 'REQUEST A RESERVATION <span>→</span>';
        postForm.remove();
      }, 1500);
    } catch (error) {
      console.error(error);
      status.className = "form-status error";
      status.textContent = "We couldn’t send the request. Please try again or contact Pinesoul directly.";
      button.disabled = false;
      button.innerHTML = 'REQUEST A RESERVATION <span>→</span>';
      postForm.remove();
    }
  });
}

setupFilters();
renderMenu();
setupGallery();
setupLightbox();
setupReservation();

// Mobile hamburger menu
const mobileToggle = document.getElementById("mobileMenuToggle");
const mobileMenu = document.getElementById("mobileMenu");

function closeMobileMenu() {
  if (!mobileToggle || !mobileMenu) return;
  mobileToggle.classList.remove("is-open");
  mobileToggle.setAttribute("aria-expanded", "false");
  mobileToggle.setAttribute("aria-label", "Open navigation menu");
  mobileMenu.classList.remove("is-open");
}

if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("is-open");
    mobileToggle.classList.toggle("is-open", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  });

  mobileMenu.querySelectorAll("[data-mobile-scroll]").forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.dataset.mobileScroll);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      setTimeout(() => target.scrollIntoView({behavior:"smooth", block:"start"}), 30);
    });
  });

  document.addEventListener("click", e => {
    if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMobileMenu();
  });
}
