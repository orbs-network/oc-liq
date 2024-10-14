
export function sendToKibana(payload: Object, index = "offchain-liquidity-0") {

  console.log(`sendToKibana: ${JSON.stringify(payload)}`);
  fetch(`http://logs.orbs.network:3001/putes/${index}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}