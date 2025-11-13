'use client';

import { useEffect } from 'react';

export function useHomeEffects() {
  useEffect(() => {
    const texts = [
      'Vive la Pasión del Tango',
      'Siente el Ritmo en tu Alma',
      'Baila con el Corazón',
    ];
    let currentIndex = 0;

    function changeText() {
      const textElement = document.getElementById('slider-text');
      if (textElement) {
        (textElement as HTMLElement).style.opacity = '0';
        setTimeout(() => {
          textElement.textContent = texts[currentIndex];
          (textElement as HTMLElement).style.opacity = '1';
          currentIndex = (currentIndex + 1) % texts.length;
        }, 500);
      }
    }

    const textInterval = setInterval(changeText, 5000);

    function handleScroll() {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    }

    const sections = document.querySelectorAll('section');
    const timelineItems = document.querySelectorAll('.timeline-item');

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
    timelineItems.forEach((item) => observer.observe(item));

    const newsContainer = document.getElementById('news-container');
    if (newsContainer && newsContainer.children.length === 0) {
      const newsItems = [
        {
          title: 'Un poco de historia del tango',
          content:
            'El tango es uno de los géneros musicales más icónicos y emblemáticos de la cultura argentina, y su origen se remonta a la ciudad de Buenos Aires a fines del siglo XIX.',
          link: 'https://argentina-tango.net/2023/03/05/un-poco-de-historia-del-tango/',
        },
        {
          title: 'Clases Online Disponibles',
          content:
            'Ahora puedes aprender tango desde la comodidad de tu hogar con nuestras nuevas clases en línea. Perfectas para principiantes y bailarines experimentados.',
          link: 'https://hotmart.com/es/marketplace/productos/20-lecciones-de-tango/F62016758K',
        },
        {
          title: 'Colección de Moda Otoño/Invierno',
          content:
            'Descubre nuestra nueva colección de ropa y accesorios inspirados en el tango argentino. Elegancia y estilo para cada ocasión.',
          // PDF en public/pages/ -> accesible via /pages/otonio-invierno-2025.pdf
          link: '/pages/otonio-invierno-2025.pdf',
        },
      ];

      newsItems.forEach((item) => {
        const newsItem = document.createElement('a');
        newsItem.classList.add('news-item');
        newsItem.href = item.link;
        newsItem.target = '_blank';
        newsItem.rel = 'noopener noreferrer';
        newsItem.innerHTML = `
          <h3>${item.title}</h3>
          <p>${item.content}</p>
          <span class="read-more">Leer más →</span>
        `;
        newsContainer.appendChild(newsItem);
      });
    }

    document.querySelectorAll('#navbar a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (!targetId) return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY - 80,
            behavior: 'smooth',
          });

          const menu = document.getElementById('navbar-menu');
          const toggle = document.getElementById('menu-toggle');
          if (menu?.classList.contains('active')) {
            menu.classList.remove('active');
            toggle?.classList.remove('active');
          }
        }
      });
    });

    function adjustImageSizes() {
      const windowWidth = window.innerWidth;
      const imageContainers = document.querySelectorAll('.image-content');

      imageContainers.forEach((container) => {
        const img = container.querySelector('img');
        if (img instanceof HTMLImageElement) {
          if (windowWidth <= 360) img.style.maxWidth = '75%';
          else if (windowWidth <= 480) img.style.maxWidth = '80%';
          else if (windowWidth <= 768) img.style.maxWidth = '85%';
          else if (windowWidth <= 1024) img.style.maxWidth = '90%';
          else img.style.maxWidth = '100%';
        }
      });

      const clientLogos = document.querySelectorAll('.client-logos img');
      clientLogos.forEach((logo) => {
        if (logo instanceof HTMLImageElement) {
          if (windowWidth <= 360) logo.style.maxWidth = '80px';
          else if (windowWidth <= 480) logo.style.maxWidth = '90px';
          else if (windowWidth <= 768) logo.style.maxWidth = '110px';
          else if (windowWidth <= 1024) logo.style.maxWidth = '150px';
          else logo.style.maxWidth = '180px';
        }
      });
    }

    adjustImageSizes();
    window.addEventListener('resize', adjustImageSizes);
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      clearInterval(textInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', adjustImageSizes);
      observer.disconnect();
    };
  }, []);
}
