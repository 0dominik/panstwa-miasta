export const getDuplicates = (array) => {
  const duplicates = [];

  for (let i = 0; i < array.length; i++) {
    if (array.filter((el) => el != array[i]).length < array.length - 1 && array[i]) {
      duplicates.push(i);
    }
  }

  return duplicates;
};

export const generateRoomId = () => {
  return Math.floor(Math.random() * 9000 + 1000).toString();
};
