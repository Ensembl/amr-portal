# Overall frontend architecture

Date: 2025-10-03

As of October 2025, the requirements for the AMR site are as follows:

- It should have a home page, an about page, and a help page (or pages)
  - These pages are likely to have purely static content
    - Although it is not known at this stage what design (and thus functionality) will be proposed for the help pages (consider the interactive elements on the help pages of the new Ensembl website, such as the megamenu, or the history buttons — it is unknown at this stage whether any of that will reappear on the AMR site)
- It should also have a very interactive page for the main activity, on which the user interrogates the data about antimicrobial resistance.
- The site will be hosted on ebi.ac.uk; and therefore, should have the branding (as well as, possibly, the look and feel) of an EBI site.
  - For reference, EMBL look and feel is captured in the Visual Framework design system (https://stable.visual-framework.dev/)

Beyond this, it is unknown, at least for developers, how the site will evolve.

Given this description, it seems sensible to build the site with a static site generator (such as Eleventy) for static content pages