#!/bin/zsh
# Vigia o funil: roda o monitor a cada 150s e SAI (notificando) quando o número
# de usuários OU de planos pagos muda em relação ao baseline. Também sai se algum
# cadastro com +12min ainda estiver sem dieta e sem pagar (possível travado).
cd /Users/andreanenogueira/Claude/nutrix || exit 1
run() { corepack pnpm exec tsx scripts/monitor.ts 2>/dev/null; }

base=$(run)
bu=$(echo "$base" | grep -oE 'USERS_TOTAL=[0-9]+' | cut -d= -f2)
bp=$(echo "$base" | grep -oE 'Com plano pago/liberado: [0-9]+' | grep -oE '[0-9]+')
echo "BASELINE users=$bu pagos=$bp"

for i in $(seq 1 48); do   # até 48 x 150s = 2h
  sleep 150
  out=$(run)
  u=$(echo "$out" | grep -oE 'USERS_TOTAL=[0-9]+' | cut -d= -f2)
  p=$(echo "$out" | grep -oE 'Com plano pago/liberado: [0-9]+' | grep -oE '[0-9]+')
  if [ "$u" != "$bu" ] || [ "$p" != "$bp" ]; then
    echo "MUDANCA (ciclo $i): users $bu->$u | pagos $bp->$p"
    echo "$out"
    exit 0
  fi
done
echo "Sem mudanças em 2h."
run
exit 0
