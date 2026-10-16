// Fetch a fresh token after login/logout; never retry a mutation automatically.
async function csrfToken() {
    const response = await fetch('/api/csrf', {cache: 'no-store', credentials: 'same-origin'});
    if (!response.ok) throw new Error('Неуспешна проверка на сесията. Презаредете страницата.');
    return response.json();
}
async function secureFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrf = await csrfToken();
        headers.set(csrf.headerName, csrf.token);
    }
    return fetch(url, {...options, headers, credentials: 'same-origin'});
}
document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== 'post') return;
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
        const csrf = await csrfToken();
        let input = form.querySelector('input[name="_csrf"]');
        if (!input) { input = document.createElement('input'); input.type = 'hidden'; form.appendChild(input); }
        input.name = csrf.parameterName; input.value = csrf.token;
        HTMLFormElement.prototype.submit.call(form);
    } catch (error) { alert(error.message); if (submit) submit.disabled = false; }
});
