FROM nginx:1.14

LABEL maintainer="ensembl-webteam@ebi.ac.uk"
RUN groupadd amr && useradd amr -g amr
USER amr
EXPOSE 80 8000

RUN rm /etc/nginx/conf.d/*

COPY --chown=amr:amr ./frontend/nginx-conf/local.conf /etc/nginx/conf.d/local.conf
COPY --chown=amr:amr ./frontend/nginx-conf/mime.types /etc/nginx/conf.d/mime.types

