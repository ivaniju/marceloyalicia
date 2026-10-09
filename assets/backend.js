/*
 * Sustituye al servidor original (/api/trpc) para que la web funcione en GitHub Pages.
 * Guarda las confirmaciones en una Google Sheet a través de Google Apps Script
 * y permite descargar el Excel con contraseña. La contraseña se comprueba en Google,
 * no en esta página.
 */
(function () {
  var realFetch = window.fetch.bind(window);

  function resp(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  function okRes(data) { return { result: { data: { json: data } } }; }
  function errRes(msg, code, http) {
    return { error: { json: { message: msg, code: -32603, data: { code: code, httpStatus: http } } } };
  }

  function callScript(payload) {
    var url = window.RSVP_ENDPOINT;
    if (!url) return Promise.reject(new Error("RSVP_ENDPOINT sin configurar"));
    return realFetch(url, {
      method: "POST",
      // text/plain evita la comprobación previa (preflight) que Apps Script no admite
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json(); });
  }

  function handle(proc, input) {
    if (proc === "auth.me") return Promise.resolve({ status: 200, body: okRes(null) });

    if (proc === "rsvp.submit") {
      var d = input || {};
      if (!d.fullName || String(d.fullName).trim().length < 2)
        return Promise.resolve({ status: 400, body: errRes("Nombre no válido", "BAD_REQUEST", 400) });
      return callScript({
        action: "submit",
        fullName: String(d.fullName).slice(0, 160),
        attendance: d.attendance,
        side: d.side,
        bus: d.bus,
        guestCount: Number(d.guestCount) || 0,
        allergyInfo: d.allergyInfo ? String(d.allergyInfo).slice(0, 1000) : "",
        notes: d.notes ? String(d.notes).slice(0, 1200) : "",
      }).then(function (r) {
        if (r && r.ok) return { status: 200, body: okRes({ ok: true }) };
        return { status: 500, body: errRes("No se pudo guardar", "INTERNAL_SERVER_ERROR", 500) };
      });
    }

    if (proc === "rsvp.exportResponses" || proc === "admin.exportRsvps") {
      return callScript({ action: "export", password: (input || {}).password || "" }).then(function (r) {
        if (r && r.ok) return { status: 200, body: okRes(r.rows || []) };
        return { status: 401, body: errRes("Contraseña incorrecta.", "UNAUTHORIZED", 401) };
      });
    }

    return Promise.resolve({ status: 200, body: okRes(null) });
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var m = url.match(/\/api\/trpc\/([^?]*)(\?.*)?$/);
    if (!m) return realFetch(input, init);

    var procs = decodeURIComponent(m[1]).split(",");
    var query = m[2] || "";
    var isBatch = /[?&]batch=1/.test(query);

    var inputs = {};
    try {
      if (init && init.body) {
        var b = JSON.parse(init.body);
        inputs = isBatch ? b : { 0: b };
      } else {
        var q = query.match(/[?&]input=([^&]*)/);
        if (q) {
          var p = JSON.parse(decodeURIComponent(q[1]));
          inputs = isBatch ? p : { 0: p };
        }
      }
    } catch (e) { inputs = {}; }

    var jobs = procs.map(function (proc, i) {
      var inp = inputs[i] && inputs[i].json !== undefined ? inputs[i].json : inputs[i];
      return handle(proc, inp).catch(function () {
        return { status: 500, body: errRes("Error de conexión", "INTERNAL_SERVER_ERROR", 500) };
      });
    });

    return Promise.all(jobs).then(function (rs) {
      if (isBatch) return resp(rs.map(function (r) { return r.body; }), 200);
      return resp(rs[0].body, rs[0].status);
    });
  };
})();
