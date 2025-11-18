// Modern utility functions to replace jQuery

export const $ = (selector, context = document) => {
    if (typeof selector === 'string') {
        return context.querySelector(selector);
    }
    return selector;
};

export const $$ = (selector, context = document) => {
    return Array.from(context.querySelectorAll(selector));
};

export const createElement = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
};

export const ajax = async (options) => {
    const {
        url,
        method = 'GET',
        data = null,
        contentType = 'application/json',
        dataType = 'json'
    } = options;

    const fetchOptions = {
        method: method.toUpperCase(),
        headers: {}
    };

    if (contentType) {
        fetchOptions.headers['Content-Type'] = contentType;
    }

    if (data) {
        fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
    }

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const error = new Error('HTTP error');
            error.status = response.status;
            try {
                error.responseJSON = await response.json();
            } catch (e) {
                error.responseText = await response.text();
            }
            throw error;
        }

        if (dataType === 'json') {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        throw error;
    }
};

export const on = (element, event, selector, handler) => {
    if (typeof selector === 'function') {
        handler = selector;
        element.addEventListener(event, handler);
    } else {
        element.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler.call(e.target, e);
            }
        });
    }
};

export const ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

export const hide = (element) => {
    element.style.display = 'none';
};

export const show = (element) => {
    element.style.display = '';
};

export const fadeOut = (element, duration = 200) => {
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '0';
    setTimeout(() => hide(element), duration);
};

export const empty = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

export const append = (parent, ...children) => {
    children.forEach(child => {
        if (typeof child === 'string') {
            parent.insertAdjacentHTML('beforeend', child);
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (Array.isArray(child)) {
            append(parent, ...child);
        }
    });
};

export const addClass = (element, className) => {
    element.classList.add(...className.split(' '));
};

export const removeClass = (element, className) => {
    element.classList.remove(...className.split(' '));
};

export const toggleClass = (element, className) => {
    element.classList.toggle(className);
};

export const hasClass = (element, className) => {
    return element.classList.contains(className);
};

export const attr = (element, attributes) => {
    if (typeof attributes === 'string') {
        return element.getAttribute(attributes);
    }
    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key]);
    });
};

export const val = (element, value) => {
    if (value === undefined) {
        return element.value;
    }
    element.value = value;
};

export const html = (element, content) => {
    if (content === undefined) {
        return element.innerHTML;
    }
    element.innerHTML = content;
};

export const text = (element, content) => {
    if (content === undefined) {
        return element.textContent;
    }
    element.textContent = content;
};
