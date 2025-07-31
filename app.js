document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle');

    // --- Global Theme Controller ---
    const applyTheme = (theme) => {
        body.classList.remove('light-mode', 'dark-mode');
        body.classList.add(theme);
        localStorage.setItem('theme', theme);
        if (themeToggleBtn) {
            themeToggleBtn.classList.toggle('dark', theme === 'dark-mode');
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
            applyTheme(newTheme);
        });
    }

    // --- Global Scroll-Up Button Controller ---
    const scrollUpBtn = document.getElementById('scroll-up-btn');
    const progressRing = document.querySelector('.progress-ring__indicator');
    
    if (scrollUpBtn && progressRing) {
        const radius = progressRing.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        progressRing.style.strokeDashoffset = circumference;
        const setProgress = (percent) => {
            const offset = circumference - (percent / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) { scrollUpBtn.classList.add('visible'); } 
            else { scrollUpBtn.classList.remove('visible'); }
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            setProgress(scrollPercent);
        });
        scrollUpBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Page Specific Logic ---

    // ** 1. Main Page (index.html) Logic **
    if (document.getElementById('welcome-overlay') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        const welcomeOverlay = document.getElementById('welcome-overlay');
        const startBtn = document.getElementById('start-journey-btn');
        const mainContent = document.getElementById('main-content');

        if (window.location.hash === '#home' && welcomeOverlay) {
            welcomeOverlay.remove();
            mainContent.style.display = 'block';
        } else if (welcomeOverlay) {
            mainContent.style.display = 'none';
            startBtn.addEventListener('click', () => {
                welcomeOverlay.classList.add('hidden');
                mainContent.style.display = 'block';
                setTimeout(() => { welcomeOverlay.remove(); }, 500);
            });
        }
        
        fetch('story.json')
            .then(response => { if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`); return response.json(); })
            .then(data => {
                const homeContainer = document.querySelector('.home-container');
                if (!homeContainer) return;
                homeContainer.innerHTML = '';

                data.arcs.forEach((arc, index) => {
                    const arcSection = document.createElement('section');
                    arcSection.id = `arc${index + 1}`;
                    arcSection.className = 'arc';
                    const arcTitle = document.createElement('h2');
                    arcTitle.textContent = arc.arc_name;
                    const cardContainer = document.createElement('div');
                    cardContainer.className = 'card-container';
                    arc.stories.forEach(story => {
                        const cardLink = document.createElement('a');
                        cardLink.className = 'card';
                        cardLink.href = `story.html?story_id=${story.id}`;
                        cardLink.innerHTML = `<h3>${story.id}. ${story.title}</h3>`;
                        cardContainer.appendChild(cardLink);
                    });
                    arcSection.appendChild(arcTitle);
                    arcSection.appendChild(cardContainer);
                    homeContainer.appendChild(arcSection);
                });
                
                initializeCardAnimations();
                initializePageTransitions();
            })
            .catch(error => {
                console.error('Failed to load stories:', error);
                const homeContainer = document.querySelector('.home-container');
                if(homeContainer) homeContainer.innerHTML = '<p style="text-align:center; color:red;">Could not load stories. Please check the data file and try again.</p>';
            });
    }

    // ** 2. Story Page (story.html) Logic **
    if (body.classList.contains('story-page')) {
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = parseInt(urlParams.get('story_id'));
        const storyContentEl = document.getElementById('story-content');
        const translateSwitch = document.querySelector('.translate-switch');
        const langButtons = document.querySelectorAll('.lang-btn');
        const glider = document.querySelector('.glider');
        let currentStoryData = null;
        let currentLang = 'english';

        const renderStory = (lang) => {
            const content = currentStoryData.content[lang];
            const title = currentStoryData.title;
            document.title = `Mawrid Path - ${title}`;
            storyContentEl.innerHTML = `<h1>${title}</h1><div class="story-content-wrapper">${content}</div>`;
            const newWrapper = storyContentEl.querySelector('.story-content-wrapper');
            if (newWrapper) { requestAnimationFrame(() => newWrapper.classList.remove('fading')); }
        };
        
        const handleLanguageChange = (lang, buttonEl) => {
            if (!currentStoryData || currentLang === lang) return;
            currentLang = lang;
            const index = Array.from(langButtons).indexOf(buttonEl);
            if (glider) glider.style.transform = `translateX(${index * 100}%)`;
            langButtons.forEach(btn => btn.classList.remove('active'));
            buttonEl.classList.add('active');
            const wrapper = storyContentEl.querySelector('.story-content-wrapper');
            if (wrapper) wrapper.classList.add('fading');
            setTimeout(() => { renderStory(currentLang); }, 400);
        };
        
        if (translateSwitch) {
            langButtons.forEach(button => {
                button.addEventListener('click', () => handleLanguageChange(button.dataset.lang, button));
            });
        }

        fetch('story.json')
            .then(response => response.json())
            .then(data => {
                for (const arc of data.arcs) {
                    const foundStory = arc.stories.find(story => story.id === storyId);
                    if (foundStory) { currentStoryData = foundStory; break; }
                }
                if (currentStoryData) { renderStory(currentLang); } else {
                    storyContentEl.innerHTML = '<h1>404 - Story Not Found</h1><p>The story you are looking for does not exist.</p>';
                }
            })
            .catch(error => { console.error('Error fetching story:', error); storyContentEl.innerHTML = '<h1>Error</h1><p>Could not load the story. Please try again later.</p>'; });
        
        initializePageTransitions();
    }
});

function initializeCardAnimations() {
    const cards = document.querySelectorAll('.card');
    const maxRotation = 6;
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = maxRotation * ((y / height) - 0.5) * -1;
            const rotateY = maxRotation * ((x / width) - 0.5);
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
}

function initializePageTransitions() {
    const links = document.querySelectorAll('a.card, a.back-btn-creative');
    const mainContent = document.getElementById('main-content');
    const storyContent = document.querySelector('.story-page .story-container');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hostname !== window.location.hostname || link.target === '_blank') {
                return;
            }
            e.preventDefault();
            const destination = link.href;
            let containerToFade = null;
            if (mainContent) containerToFade = mainContent;
            if (storyContent) containerToFade = storyContent;
            if (containerToFade) {
                containerToFade.classList.add('page-fade-out');
            }
            setTimeout(() => {
                window.location.href = destination;
            }, 300);
        });
    });
}
