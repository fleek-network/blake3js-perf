const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

// 0, ..., 15
let numbers = MSG_PERMUTATION.map((_, idx) => idx);
for (let i = 0; i < 7; ++i) {
  // console.log(JSON.stringify(numbers));

  let args = numbers.join(",");
  console.log(`round(state, m, [${args}]);`);
  numbers = MSG_PERMUTATION.map((p) => numbers[p]);
}
