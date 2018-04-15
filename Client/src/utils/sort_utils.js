export const sortCourses = (a, b) => {
  if (a.department < b.department) {
    return -1
  }
  else if (a.department > b.department) {
    return 1
  }
  else if (a.number < b.number) {
    return -1
  }
  else if (a.number > b.number) {
    return 1
  }
  return 0
}

export const sortInterval = (a, b) => {
  if (a[0] < b[0]) {
    return -1
  }
  else if (a[0] > b[0]) {
    return 1
  }
  else if (a[1] < b[1]) {
    return -1
  }
  else if (a[1] > b[1]) {
    return 1
  }
  return 0
}
