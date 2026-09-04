# 🌌 Simulador de Buraco Negro & Centro Galáctico

Simulação física e astronômica em tempo real de buracos negros no centro de galáxias, com lentes gravitacionais de Einstein, disco de acreção com *Doppler beaming* relativístico, jatos de plasma e catálogo de corpos celestes em órbita com rotulagem inteligente sob aproximação de câmera.

---

## 🎮 Controles de Navegação

- **🖱️ Clique com o botão esquerdo e arraste**: Move a visualização livremente pelo espaço cósmico (*Pan*). Ao dar zoom, partes da galáxia saem do campo de visão e você pode arrastar para qualquer direção.
- **🔍 Roda do mouse (Scroll)**: Zoom contínuo focado no seu ponteiro (*Zoom-to-cursor*), com alcance estendido de $0.2\times$ até $45.0\times$.
- **✨ Rótulos e Telemetria Inteligente**: Os nomes, velocidades orbitais (% de $c$) e dilatação temporal **só surgem quando você aproximar a câmera daquele astro celeste específico**, evitando poluição visual e sobreposição de textos.
- **🎯 Catálogo Lateral de Astros**: Clique em qualquer corpo na lista lateral ("Astros em Órbita") para voar a câmera suavemente até ele e revelar seus dados instantaneamente.
- **⏱️ Controles de Simulação**: Pausar/retomar, ajuste da velocidade do tempo ($0\times$ a $4\times$) e inclinação do plano de observação ($0^\circ$ a $84^\circ$).
- **🔊 Som Cósmico**: Drone procedural sub-grave via Web Audio API ajustado dinamicamente pela massa e taxa de acreção.

---

## 🪐 Buracos Negros Catalogados

1. **Sagittarius A\*** (*Via Láctea* — $4,3 \times 10^6 M_\odot$)
   - *Astros*: Estrela S2 (S0-2), Estrela S4714 (8% de $c$), Estrela S62 (período de 9,9 anos), Estrela S0-102, Nuvem de Gás G2 e Magnetar Pulsar PSR J1745-2900.
2. **M87\*** (*Messier 87 / Virgo A* — $6,5 \times 10^9 M_\odot$)
   - *Astros*: Nó de Choque HST-1 (6c aparente), Lobo Terminal do Jato (0,99c), Aglomerado Globular, Galáxia Anã NGC 4486B em canibalização e Estrela TDE em espaguetificação.
3. **Gargantua** (*Interestelar / Kerr* — $1,0 \times 10^8 M_\odot$)
   - *Astros*: Planeta Miller (1h = 7 anos), Módulo Lander, Nave Ranger, Estação Espacial Endurance, Planeta Mann e Planeta Edmunds.
4. **Cygnus X-1** (*Binária de Raios-X* — $21 M_\odot$)
   - *Astros*: Supergigante Azul HDE 226868 com lóbulo de Roche, Ponto de Lagrange L1 & Ponte de Plasma, Hot Spot de Impacto e Jato Bipolar de Raios-X.
5. **TON 618** (*Quasar Ultramassivo* — $6,6 \times 10^{10} M_\odot$)
   - *Astros*: Torus Molecular de Poeira, Nuvem Relativística BLR-Alpha (7.000 km/s), Estrela Hiperveloz HV-Exodus e Aglomerado Primordial Pop III.

---

## 🚀 Como Executar

Instale as dependências (caso ainda não tenha feito) e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Ou gere a versão otimizada de produção:

```bash
npm run build
```

---

## 🛠️ Correções e Melhorias Realizadas

- **Foco inteligente de rótulos**: Corrigido o bug em que todos os nomes de corpos celestes surgiam simultaneamente e sobrepostos. Agora cada rótulo só se torna visível quando a câmera dá zoom e foca no respectivo corpo.
- **Remoção de duplicata e inclusão do TON 618**: Eliminada a chave duplicada de Gargantua no catálogo de presets e adicionado o quasar ultramassivo TON 618.
- **Expansão do zoom**: Limite ampliado de 8x para 45x, permitindo ver detalhes de perto de cada estrela e planeta.
- **Cursor de arraste corrigido**: Adicionado feedback visual de `grabbing` no arraste do mouse.
- **Prevenção de vazamento de áudio**: Reutilização de instância única de `AudioContext` para impedir estouro de limites do navegador ao alternar som repetidamente.
- **Limpeza de dependências**: Removidas dependências pesadas e não utilizadas que estavam inflando o projeto.
