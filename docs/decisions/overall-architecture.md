For the overall architecture of this app, we considered a choice between:
  - A traditional client/server model, where the data is provided by a backend via api calls
  - A client-only model, in which the client runs its own copy of the database (duckDB), and retrieves from it all the data required to drive the UI

The focus of discussion was specifically the feasibility of the client-only model.

Upsides:
- Avoids load on our infrastructure (all compute required for data processing is offloaded onto the user)
- As a consequence, allows for easy scaling
- Allows for fast prototyping

Downsides:
- Large payload size
  - DuckDB wasm binary (shell.duckdb.org loads a 7.5MB wasm file)
  - Database itself (depending on queries, may need to load a significant fraction of the database file)
    - The database is likely to grow going forward
  - Might be somewhat mitigated by moving files closer to users via CDNs
- Higher demands on users' devices: cpu, memory, browser versions
- Reduced observability
  - This could be mitigated by client-side reporting of errors or load times
- Reduced debuggability
  - DuckDB wasm binary is a black box

Decisions:
  - We acknowledge the downsides of the client-only architecture; but agree to proceed with it in order to speed up the development