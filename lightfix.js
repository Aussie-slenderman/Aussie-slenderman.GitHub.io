// Fix light mode text visibility — runs every 2s, detects light bg and forces dark text
setInterval(function(){
  try {
    var root = document.getElementById('root');
    if (!root) return;
    var bg = window.getComputedStyle(root.firstChild || root).backgroundColor;
    var isLight = bg && (bg.indexOf('255') > -1 || bg.indexOf('243') > -1 || bg.indexOf('245') > -1 || bg === 'rgb(255, 255, 255)');
    if (isLight) {
      // Force white/cyan text to black in light mode
      document.querySelectorAll('.r-1gnjku,.r-1ff0s43,.r-jwli3a').forEach(function(el) {
        el.style.setProperty('color', '#0A0E1A', 'important');
      });
      // Force dim text to dark gray
      document.querySelectorAll('.r-1npgj5g,.r-1s7ct43').forEach(function(el) {
        el.style.setProperty('color', '#374151', 'important');
      });
    }
  } catch(e) {}
}, 2000);
