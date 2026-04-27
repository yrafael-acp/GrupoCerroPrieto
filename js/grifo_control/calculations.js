function recalcular() {
  const gasSis = getVal("gas_falta") + getVal("gas_sap");
  const gasFis = getVal("gas_tanque") + getVal("gas_iso");
  document.getElementById("gas_totalSis").textContent = fmt(gasSis);
  document.getElementById("gas_totalFis").textContent = fmt(gasFis);
  setDif("gas_dif", gasFis - gasSis);

  const petSis = getVal("pet_falta") + getVal("pet_sap");
  const petFis = getVal("pet_tanque") + getVal("pet_iso") + getVal("pet_hipo");
  document.getElementById("pet_totalSis").textContent = fmt(petSis);
  document.getElementById("pet_totalFis").textContent = fmt(petFis);
  setDif("pet_dif", petFis - petSis);

  const difGas = gasFis - gasSis;
  const difPet = petFis - petSis;

  const rg = document.getElementById("res_gas");
  rg.textContent = fmt(difGas);
  rg.style.color = difGas >= 0 ? "var(--success)" : "var(--danger)";

  const rp = document.getElementById("res_pet");
  rp.textContent = fmt(difPet);
  rp.style.color = difPet >= 0 ? "var(--success)" : "var(--danger)";

  document.getElementById("res_sisg").textContent = fmt(gasSis);
  document.getElementById("res_sisp").textContent = fmt(petSis);
}
