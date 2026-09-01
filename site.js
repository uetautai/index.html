/* BrokenStitch site behaviour
   Layer B public site only.
*/
var ADMIN_EMAIL = "referrals@brokenstitch.org.au";
var SAFETY_EMAIL = "info@brokenstitch.org.au";
var FORM_ENDPOINT = "https://formspree.io/f/xppzpvld";

(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
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
    var roleField = document.getElementById("role-field");

    function setRoleVisibility() {
      var org = form.querySelector('input[name="contact_type"][value="organisation"]');
      var show = org && org.checked;
      if (roleField) roleField.hidden = !show;
    }

    if (opts.id === "referral-form") {
      form.querySelectorAll('input[name="contact_type"]').forEach(function (input) {
        input.addEventListener("change", setRoleVisibility);
      });
      setRoleVisibility();
    }

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
          form.reset();
          if (opts.id === "referral-form") setRoleVisibility();
          if (opts.thankYou) {
            window.location.href = opts.thankYou;
            return;
          }
          setStatus("Received. Thank you.", true);
        }).catch(function () {
          setStatus("Could not send from this page. Please email " + opts.email + ".", false);
        });
        return;
      }

      var body = opts.mailtoBody(payload);
      var mailto = "mailto:" + encodeURIComponent(opts.email) +
        "?subject=" + encodeURIComponent(opts.subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
      setStatus("Could not send from this page. Please email " + opts.email + ".", false);
    });
  }

  wireForm({
    id: "referral-form",
    statusId: "form-status",
    email: ADMIN_EMAIL,
    subject: "BrokenStitch contact",
    thankYou: "thank-you.html",
    payload: function (data) {
      return {
        form: "referral",
        contact_type: data.get("contact_type") || "",
        name: (data.get("name") || "").trim(),
        role: (data.get("role") || "").trim(),
        email: (data.get("email") || "").trim(),
        phone: (data.get("phone") || "").trim(),
        message: (data.get("message") || "").trim()
      };
    },
    validate: function (payload) {
      if (!payload.contact_type) return "Choose individual or organisation.";
      if (!payload.name) return "Name is required.";
      if (!payload.email) return "Email is required.";
      return "";
    },
    mailtoBody: function (payload) {
      return [
        "Contact type: " + payload.contact_type,
        "Name: " + payload.name,
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
    subject: "BrokenStitch partner enquiry",
    payload: function (data) {
      return {
        form: "partner",
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
      if (!payload.offer) return "Say what you want to offer.";
      return "";
    },
    mailtoBody: function (payload) {
      return [
        "Form: partner",
        "Organisation: " + payload.organisation,
        "Contact name: " + payload.name,
        "Email: " + payload.email,
        payload.phone ? "Phone: " + payload.phone : "",
        "What you want to offer: " + payload.offer
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
        var payload = { form: form.getAttribute("data-form") || "child-safety" };
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
          if (order.indexOf(key) === -1 && payload[key]) lines.push(key + ": " + payload[key]);
        });
        return lines.join("\n");
      }
    });
  });
})();
