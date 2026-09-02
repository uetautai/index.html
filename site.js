  wireForm({
    id: "referral-form",
    statusId: "form-status",
    email: ADMIN_EMAIL,
    subject: "BrokenStitch referral enquiry",
    thankYou: "thank-you.html",
    payload: function (data) {
      return {
        form: "referral-enquiry",
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