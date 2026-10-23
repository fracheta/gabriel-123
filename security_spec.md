# Security Specification & Test-Driven Security Matrix

## 1. Data Invariants

1. **Denial-by-Default Invariant**: Any path not explicitly matched must be rejected with `PERMISSION_DENIED`.
2. **Catalog Integrity**: Books in `/livros/{livroId}` must have a non-empty `titulo` (<= 200 chars), `autor` (<= 150 chars), and a positive integer `quantidade` (>= 0).
3. **Student Directory Integrity**: Students in `/alunos/{alunoId}` must possess a valid `nome` (<= 150 chars) and a unique `matricula` (<= 50 chars).
4. **Loan Referencing Invariant**: An `/emprestimos/{emprestimoId}` record cannot exist without valid IDs `livroId` and `alunoId`, plus valid ISO formatted timestamps for loan checkout and expected return.
5. **Loan Status & Lifecycle**: Once returned (`dataDevolucao != null`), loans cannot be rewritten with prior open dates.
6. **Reservation Consistency**: `/reservas/{reservaId}` must only hold valid status states (`pendente`, `aprovada`, `rejeitada`, `cancelada`).
7. **Reviews & Rating Bounds**: `/avaliacoes/{avaliacaoId}` rating must be an integer or number between 1 and 5 stars.
8. **Bounded Strings & Denial of Wallet Defense**: All text inputs must be bounded strictly by size checks (e.g. `size() <= 200`, `size() <= 2000`) to prevent payload exhaustion attacks.
9. **Admin Identity Gate**: Admin privileges for sensitive operations check against authenticated admin email `anapaulafracheta@gmail.com` or trusted records.
10. **ID Poisoning Defense**: Document path parameters must adhere to safe identifier constraints (`isValidId`).

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Ghost Field Injection / Shadow Update on Livro)**:
   Attempt to inject `{ "isFreeForTaking": true, "titulo": "Teste", "autor": "X", "quantidade": 5 }`.
   *Expected*: `PERMISSION_DENIED` (hasOnly violation).

2. **Payload 2 (Denial of Wallet 1MB String Attack on Livro Titulo)**:
   Attempt to create book with `titulo` containing 1MB junk string.
   *Expected*: `PERMISSION_DENIED` (`size() <= 200` violation).

3. **Payload 3 (Negative Quantity Attack on Livro)**:
   Attempt to store `quantidade: -10`.
   *Expected*: `PERMISSION_DENIED` (`quantidade >= 0` check).

4. **Payload 4 (Orphaned Loan - Missing Aluno ID)**:
   Attempt to create loan with `{ "livroId": "livro123", "dataEmprestimo": "2026-10-23", "dataPrevista": "2026-11-06" }` without `alunoId`.
   *Expected*: `PERMISSION_DENIED` (hasAll check failure).

5. **Payload 5 (Illegal State Transition on Reserva)**:
   Attempt to set `status: "hacked_status"`.
   *Expected*: `PERMISSION_DENIED` (enum validation failure).

6. **Payload 6 (Rating Out of Bounds on Avaliacao)**:
   Attempt to record `nota: 99` or `nota: -5`.
   *Expected*: `PERMISSION_DENIED` (`nota >= 1 && nota <= 5` check).

7. **Payload 7 (Student Name Injection Over Limit)**:
   Attempt to insert student with `nome` having 2000 characters.
   *Expected*: `PERMISSION_DENIED` (`size() <= 150` constraint).

8. **Payload 8 (Document Path ID Poisoning)**:
   Attempt to write to `/livros/../../etc/passwd` or oversized junk path ID.
   *Expected*: `PERMISSION_DENIED` (`isValidId` regex failure).

9. **Payload 9 (System Config Tampering by Arbitrary Guest)**:
   Unverified guest attempting to overwrite library theme or configuration in `/config/geral`.
   *Expected*: `PERMISSION_DENIED` (write restricted).

10. **Payload 10 (Unauthorized Student Record Deletion)**:
    Unauthorized or unverified user attempting to delete student profiles.
    *Expected*: `PERMISSION_DENIED`.

11. **Payload 11 (Comment Size Bomb on Avaliacao)**:
    Attempt to inject 500KB string into `comentario`.
    *Expected*: `PERMISSION_DENIED` (`size() <= 1000` rule).

12. **Payload 12 (Direct Root Write Attack)**:
    Attempt to write a document at the root level `/exploit_doc`.
    *Expected*: `PERMISSION_DENIED` (catch-all default deny).
