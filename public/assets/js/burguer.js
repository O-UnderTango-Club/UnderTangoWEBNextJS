document.addEventListener('DOMContentLoaded', function() {
  console.log("Script de menú hamburguesa cargado");
  
  const menuToggle = document.getElementById('menu-toggle');
  const navbarMenu = document.getElementById('navbar-menu');
  const navbar = document.getElementById('navbar');
  
  if (!menuToggle && navbar) {
      console.log("Creando botón de menú hamburguesa");
      
      // Crear el botón
      const newMenuToggle = document.createElement('button');
      newMenuToggle.id = 'menu-toggle';
      newMenuToggle.setAttribute('aria-label', 'Toggle menu');
      newMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      
      navbar.appendChild(newMenuToggle);
  }

  if (navbar && !navbarMenu) {
      const ulElement = navbar.querySelector('ul');
      if (ulElement) {
          ulElement.id = 'navbar-menu';
      }
  }

  const finalMenuToggle = document.getElementById('menu-toggle');
  const finalNavbarMenu = document.getElementById('navbar-menu');
  
  if (finalMenuToggle && finalNavbarMenu) {
      console.log("Configurando eventos del menú");
      
      finalMenuToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Botón de menú clickeado");
          
          finalNavbarMenu.classList.toggle('active');
          this.classList.toggle('active');
          
          const icon = this.querySelector('i');
          if (icon) {
              if (this.classList.contains('active')) {
                  icon.classList.remove('fa-bars');
                  icon.classList.add('fa-times');
              } else {
                  icon.classList.remove('fa-times');
                  icon.classList.add('fa-bars');
              }
          }
      });
      
      document.addEventListener('click', function(event) {
          const isClickInsideMenu = finalNavbarMenu.contains(event.target);
          const isClickOnToggle = finalMenuToggle.contains(event.target);
          
          if (!isClickInsideMenu && !isClickOnToggle && finalNavbarMenu.classList.contains('active')) {
              finalNavbarMenu.classList.remove('active');
              finalMenuToggle.classList.remove('active');
              
              const icon = finalMenuToggle.querySelector('i');
              if (icon) {
                  icon.classList.remove('fa-times');
                  icon.classList.add('fa-bars');
              }
          }
      });
      
      const menuLinks = finalNavbarMenu.querySelectorAll('a');
      menuLinks.forEach(link => {
          link.addEventListener('click', function() {
              finalNavbarMenu.classList.remove('active');
              finalMenuToggle.classList.remove('active');
              
              const icon = finalMenuToggle.querySelector('i');
              if (icon) {
                  icon.classList.remove('fa-times');
                  icon.classList.add('fa-bars');
              }
          });
      });
  } else {
      console.error("No se encontraron los elementos del menú");
  }
  
});