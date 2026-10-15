const tabs = [...document.querySelectorAll('[role="tab"]')];
const descriptions = {
  home: 'Captura real: pantalla de inicio clásica de ORBIT con fondo de la Tierra',
  glass: 'Captura real: ventana de ORBIT con cristal adaptativo y fondo de cascada',
  wallhaven: 'Captura real: galería de Wallhaven dentro de ORBIT',
  settings: 'Captura real: controles de apariencia, transparencia y color de ORBIT',
};
function activate(tab) {
  const key = tab.dataset.image;
  if (!Object.hasOwn(descriptions, key)) return;
  tabs.forEach(button => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const image = document.getElementById('gallery-image');
  image.src = `assets/${key}.jpg`;
  image.alt = descriptions[key];
  document.getElementById('gallery-panel').setAttribute('aria-labelledby', tab.id);
  document.getElementById('gallery-caption').textContent = tab.dataset.caption;
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activate(tabs[next]);
    tabs[next].focus();
  });
});
