import { styleProcess } from './winjs.js';
import { dataBind, jsonLdBind } from './schema-binding.js';
import { Me, ld } from './me.js';
import './diagnal-ribbon.js';
dataBind(document.querySelector("html"), Me);
jsonLdBind(ld, document);
styleProcess(document.body);