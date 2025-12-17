<style>{`
  @media (max-width: 768px) {
    /* Fix per i bottoni dei mentori su mobile */
    .grid-cols-2 > button {
      padding: 1rem !important;
      min-height: 100px;
    }
    
    /* Fix per i select su mobile iOS */
    select {
      font-size: 16px; /* Previene lo zoom automatico */
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      padding: 12px 16px;
    }
    
    /* Aggiungi freccia al select */
    .relative select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 20px;
      padding-right: 48px;
    }
  }
`}</style>
