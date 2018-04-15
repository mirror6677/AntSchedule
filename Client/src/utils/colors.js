export const primary = '#188FFF'

const majorCourseColors = [
  '#039BE5', // 0 blue
  '#D50001', // 1 red
  '#F6BF26', // 2 yellow
  '#0C8043', // 3 green
  '#8E24AA', // 4 purple
  '#E67D73', // 5 red (light)
  '#7986CB', // 6 purple (light)
  '#33B679', // 7 green (light)
  '#FF9D3F'  // 8 orange
]
const indicatorColors = [
  '#FF9D3F', // 0 orange
  '#33B679', // 1 green (light)
  '#7986CB', // 2 purple (light)
  '#E67D73', // 3 red (light)
  '#8E24AA', // 4 purple
  '#0C8043', // 5 green
  '#F6BF26', // 6 yellow
  '#D50001', // 7 red
  '#039BE5'  // 8 blue
]
export const unselectedColor = '#7B7B7B' // gray

export const colorChooser = (courses, major) => {
  var colorDict = {}
  var colors = major ? majorCourseColors : indicatorColors
  colors.forEach(color => colorDict[color] = 0)
  Object.keys(courses).forEach(course => {
    colorDict[courses[course].color] += 1
  })
  return Object.keys(colorDict).reduce((a, c) => colorDict[a] <= colorDict[c] ? a : c)
}
