/* ============================================================
   sidebar.js - Top Navigation Menu
   ============================================================ */

function renderSidebarMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = '';

    const adminLinks = [
        { id: 'nav-dashboard', label: 'EVENTS', view: 'view-dashboard', route: '#/admin/dashboard' },
        { id: 'nav-users', label: 'STAFF (HUB)', view: 'view-users', route: '#/admin/users' },
        { id: 'nav-checkin', label: 'CHECK-IN', view: 'view-checkin', route: '#/admin/checkin' }
    ];

    const userLinks = [
        { id: 'nav-explore', label: 'EXPLORE', view: 'view-explore', route: '#/user/explore' },
        { id: 'nav-tickets', label: 'MY TICKETS', view: 'view-tickets', route: '#/user/tickets' }
    ];

    const links = currentUser.role === 'admin' ? adminLinks : userLinks;

    links.forEach((link) => {
        const div = document.createElement('div');
        div.id = link.id;
        div.dataset.view = link.view;
        div.dataset.route = link.route;
        div.className = `nav-item ${window.location.hash === link.route ? 'active' : ''}`;
        div.innerHTML = `<span>${link.label}</span>`;

        div.addEventListener('click', () => {
            window.location.hash = link.route;
        });

        navMenu.appendChild(div);
    });

    const currentView = APP_ROUTES[window.location.hash]?.viewId;
    if (currentView) {
        setActiveNavByView(currentView);
    } else if (links[0]) {
        setActiveNavByView(links[0].view);
    }
}
