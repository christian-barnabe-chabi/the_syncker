na = 5
ta = 4.5
mi = 1000000
mf = mi

// tm = ta / 12
// for(i=1; i<12*na; i++)
//     mf = mf + mf * tm / 100

for(i=0; i<na; i++)
    mf = mf + mf * ta / 100

// mf += applyTaxes(mf, ta)
// mf += applyTaxes(mf, ta)
// mf += applyTaxes(mf, ta)
// mf += applyTaxes(mf, ta)
// mf += applyTaxes(mf, ta)

mf = parseInt(mf)
console.log(mf)

function applyTaxes(amount, taxe) {
    let toBeAdded = amount * taxe / 100
    console.log(toBeAdded)
    return toBeAdded;
}