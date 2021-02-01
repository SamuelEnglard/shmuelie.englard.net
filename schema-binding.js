import { dataBindWidget } from './contact-widgets.js';
import { isArray, isElement, isSchemaType } from './type-guards.js';
import { formatDateTime, formatPhone } from './formatters.js';
function getElementType(element) {
    while (!element.hasAttribute("itemscope")) {
        if (element.parentElement === null) {
            return null;
        }
        element = element.parentElement;
    }
    const itemType = element.getAttribute("itemtype");
    if (itemType === null) {
        return null;
    }
    const schemaOrg = "https://schema.org/";
    return itemType.substr(schemaOrg.length);
}
function getProperty(obj, propertyName) {
    if (propertyName in obj) {
        return obj[propertyName];
    }
    return null;
}
export function dataBind(element, data) {
    if (typeof data === "string") {
        dataBindAsString(element, data);
    }
    else if (isArray(data)) {
        dataBindAsArray(element, data);
    }
    else {
        const currentType = getElementType(element);
        if (currentType === null) {
            throw new Error("Unknown element data type");
        }
        if (currentType !== data['@type']) {
            throw new Error("Data type does not match element type");
        }
        if (element.dataset.formatter && (element.dataset.formatter in thingFormatters) && thingFormatters[element.dataset.formatter](data, element)) {
            return;
        }
        for (const propertyName of Object.keys(data).filter(pn => !pn.startsWith("@"))) {
            const propertyValue = getProperty(data, propertyName);
            const elementProperty = element.querySelector("*[itemprop=" + propertyName + "]");
            if (elementProperty !== null && propertyValue !== null) {
                dataBind(elementProperty, propertyValue);
            }
        }
    }
}
function dataBindAsArray(element, data) {
    for (const item of data) {
        const tmpl = (typeof item === "string") ? element.querySelector("template[data-type=Text]") : element.querySelector("template[data-type=" + item["@type"] + "]");
        if (tmpl && tmpl.content.firstElementChild) {
            const clone = tmpl.content.firstElementChild.cloneNode(true);
            dataBind(clone, item);
            element.appendChild(clone);
        }
    }
}
function dataBindAsString(element, data) {
    if (element.dataset.formatter && (element.dataset.formatter in stringFormatters) && stringFormatters[element.dataset.formatter](data, element)) {
        return;
    }
    element.innerText = data;
}
function dateFormatter(data, element) {
    if (isElement(element, "time")) {
        element.innerText = formatDateTime(data);
        element.dateTime = data;
        return true;
    }
    return false;
}
function emailFormatter(data, element) {
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (isElement(element, "a") && emailRegex.test(data)) {
        element.href = "mailto:" + data;
        element.innerText = data;
        return true;
    }
    return false;
}
function telephoneFormatter(data, element) {
    if (isElement(element, "a")) {
        const tel = formatPhone(data);
        if (tel) {
            element.href = tel.link;
            element.innerText = tel.display;
            return true;
        }
    }
    return false;
}
function anchorFormatter(data, element) {
    if (isElement(element, "a")) {
        element.href = data;
        return true;
    }
    return false;
}
function metaFormatter(data, element) {
    if (isElement(element, "meta")) {
        element.content = data;
        return true;
    }
    return false;
}
function imageFormatter(data, element) {
    if (isElement(element, "img")) {
        element.src = data;
        return true;
    }
    return false;
}
function contactPointFormatter(data, element) {
    if (isSchemaType(data, "ContactPoint")) {
        element.appendChild(dataBindWidget(data));
    }
    return false;
}
export const stringFormatters = {
    "date": dateFormatter,
    "meta": metaFormatter,
    "image": imageFormatter,
    "email": emailFormatter,
    "telephone": telephoneFormatter,
    "anchor": anchorFormatter
};
export const thingFormatters = {
    "contactPoint": contactPointFormatter
};
export function jsonLdBind(data, root) {
    const script = root.querySelector("script[type='application/ld+json']");
    if (script) {
        script.text = JSON.stringify(data);
    }
}