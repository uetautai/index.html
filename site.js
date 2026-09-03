/* BrokenStitch site behaviour
   Layer B public site only.
*/
var ADMIN_EMAIL = "referrals@brokenstitch.org.au";
var SAFETY_EMAIL = "info@brokenstitch.org.au";
var FORM_ENDPOINT = "https://formspree.io/f/xjyvrpag";

(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
      if (!open) {
        nav.querySelectorAll(".nav-item.is-open").forEach(function (item) {
          item.classList.remove("is-open");
        });
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var isParent = link.classList.contains("nav-parent");
        var mobile = window.matchMedia("(max-width: 1100px)").matches;
        if (isParent && mobile) {
          event.preventDefault();
          var item = link.closest(".nav-item");
          if (item) item.classList.toggle("is-open");
          return;
        }
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function wireForm(opts) {
    var form = document.getElementById(opts.id);
    if (!form) return;

    var statusEl = document.getElementById(opts.statusId);

    function setStatus(message, ok) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = "form-status" + (ok ? " is-ok" : " is-error");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var payload = opts.payload(data);

      var err = opts.validate(payload);
      if (err) {
        setStatus(err, false);
        return;
      }

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error("Submit failed");
          if (opts.thankYou) {
            window.location.href = opts.thankYou;
            return;
          }
          form.reset();
          setStatus("Received. Thank you.", true);
        }).catch(function () {
          setStatus("Could not send from this page. Please email " + opts.email + ".", false);
        });
        return;
      }

      var body = opts.mailtoBody(payload);
      window.location.href =
        "mailto:" + encodeURIComponent(opts.email) +
        "?subject=" + encodeURIComponent(opts.subject) +
        "&body=" + encodeURIComponent(body);
      setStatus("Could not send from this page. Please email " + opts.email + ".", false);
    });
  }

  wireForm({
    id: "referral-form",
    statusId: "form-status",
    email: ADMIN_EMAIL,
    subject: "BrokenStitch referral enquiry",
    thankYou: "thank-you.html",
    payload: function (data) {
      return {
        form: "referral-enquiry",
        _subject: "BrokenStitch referral enquiry",
        contact_type: "organisation",
        organisation: (data.get("organisation") || "").trim(),
        name: (data.get("name") || "").trim(),
        role: (data.get("role") || "").trim(),
        email: (data.get("email") || "").trim(),
        phone: (data.get("phone") || "").trim(),
        message: (data.get("message") || "").trim()
      };
    },
    validate: function (payload) {
      if (!payload.organisation) return "Organisation is required.";
      if (!payload.name) return "Contact name is required.";
      if (!payload.email) return "Email is required.";
      return "";
    },
    mailtoBody: function (payload) {
      return [
        "Form: referral enquiry",
        "Organisation: " + payload.organisation,
        "Contact name: " + payload.name,
        payload.role ? "Role: " + payload.role : "",
        "Email: " + payload.email,
        payload.phone ? "Phone: " + payload.phone : "",
        payload.message ? "Message: " + payload.message : ""
      ].filter(Boolean).join("\n");
    }
  });

  wireForm({
    id: "partner-form",
    statusId: "partner-form-status",
    email: SAFETY_EMAIL,
    subject: "BrokenStitch corporate partnership enquiry",
    payload: function (data) {
      return {
        form: "corporate-partnership",
        _subject: "BrokenStitch corporate partnership enquiry",
        organisation: (data.get("organisation") || "").trim(),
        name: (data.get("name") || "").trim(),
        email: (data.get("email") || "").trim(),
        phone: (data.get("phone") || "").trim(),
        offer: (data.get("offer") || "").trim()
      };
    },
    validate: function (payload) {
      if (!payload.organisation) return "Organisation is required.";
      if (!payload.name) return "Contact name is required.";
      if (!payload.email) return "Email is required.";
      if (!payload.offer) return "Say how you would like to work with us.";
      return "";
    },
    mailtoBody: function (payload) {
      return [
        "Form: corporate partnership",
        "Organisation: " + payload.organisation,
        "Contact name: " + payload.name,
        "Email: " + payload.email,
        payload.phone ? "Phone: " + payload.phone : "",
        "How you would like to work with us: " + payload.offer
      ].filter(Boolean).join("\n");
    }
  });

  document.querySelectorAll("form.report-form").forEach(function (form) {
    wireForm({
      id: form.id,
      statusId: form.id + "-status",
      email: SAFETY_EMAIL,
      subject: form.getAttribute("data-subject") || "BrokenStitch child safety concern",
      payload: function (data) {
        var payload = {
          form: form.getAttribute("data-form") || "child-safety",
          _subject: form.getAttribute("data-subject") || "BrokenStitch child safety concern"
        };
        data.forEach(function (value, key) {
          payload[key] = String(value).trim();
        });
        return payload;
      },
      validate: function (payload) {
        if (!payload.message) return "Write what you want us to know.";
        return "";
      },
      mailtoBody: function (payload) {
        var order = ["form", "about", "young_person_first_name", "role", "name", "email", "phone", "follow_up", "message"];
        var lines = [];
        order.forEach(function (key) {
          if (payload[key]) lines.push(key + ": " + payload[key]);
        });
        Object.keys(payload).forEach(function (key) {
          if (order.indexOf(key) === -1 && payload[key] && key !== "_subject") {
            lines.push(key + ": " + payload[key]);
          }
        });
        return lines.join("\n");
      }
    });
  });
})();
