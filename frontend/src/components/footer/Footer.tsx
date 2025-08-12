import { type Component } from 'solid-js';

import './Footer.css';

const Footer: Component = () => {
  return (
    <footer>
      <div class="footer-container">
        <div class="footer-left-group">
          <span class="bold">© EMBL 2025</span>
          <span>Wellcome Genome Campus, Hinxton, Cambridgeshire CB10 1SD, UK</span>
          <span class="dashed-underline">Tel: +44 (0)1223 49 44 44</span>
          <span class="dashed-underline">Full contact details</span>
        </div>
        <div class="footer-right-group">
          <span>
            <span class="bold">
              EMBL-EBI<span>&nbsp;is part of the European Molecular Biology Laboratory</span>
            </span>
          </span>
          <span class="dashed-underline">Terms of use</span>
          <span class="dashed-underline">Privacy Notice</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
