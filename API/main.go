package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/yhat/scrape"
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

// Course for search autocomplete
type Course struct {
	Department string
	CrseNum    string
	Title      string
}

// CourseDetail for selected courses
type CourseDetail struct {
	CRN        string
	Department string
	CrseNum    string
	Section    string
	Title      string
	Time       string
	Room       string
	Instructor string
	Seats      string
	Prm        string
	CCCReq     []string
	Desc       string
	Notes      string
	Linked     [][]CourseDetail
}

// CourseLookup for generating course lookup URL
type CourseLookup struct {
	LookOpt string
	Param1  string
	Param2  string
}

// CourseLookupURL that requires lookopt and param1 (and param2) to construct full URL for courses lookup
func CourseLookupURL(l CourseLookup) string {
	root := "https://www.bannerssb.bucknell.edu/ERPPRD/hwzkschd.P_Bucknell_SchedDisplay?openopt=ALL&term=201905&"
	url := root + "lookopt=" + l.LookOpt + "&param1=" + l.Param1
	if len(l.Param2) != 0 {
		url = url + "&param2=" + l.Param2
	}
	return url
}

// CourseDescURL that requires subj (department) and numb (course number) to construct full URL for course description
func CourseDescURL(subj string, numb string) string {
	root := "https://www.bannerssb.bucknell.edu/ERPPRD/bwckctlg.p_disp_course_detail?cat_term_in=201905&"
	url := root + "subj_code_in=" + subj + "&crse_numb_in=" + numb
	return url
}

// FullTextSearchURL that requires department and a query string for course title to constuct full url
func FullTextSearchURL(l CourseLookup) string {
	root := "https://www.bannerssb.bucknell.edu/ERPPRD/bwckctlg.p_display_courses/?term_in=201905&call_proc_in=bwckctlg.p_disp_dyn_ctlg&sel_subj=dummy&sel_levl=dummy&sel_schd=dummy&sel_coll=dummy&sel_divs=dummy&sel_dept=dummy&sel_attr=dummy&"
	url := root + "sel_subj=" + l.Param1 + "&sel_title=" + strings.Title(l.Param2)
	return url
}

func fetchCourses(l CourseLookup, chIsFinished chan []Course) {
	url := CourseLookupURL(l)

	// variable that keeps the result
	res := []Course{}

	// inform channel when fetchCourses is done
	defer func() {
		chIsFinished <- res
	}()

	// variable that keeps titles of a course
	titles := make(map[string][]string)

	// fetch html content
	resp, _ := http.Get(url)
	root, err := html.Parse(resp.Body)

	// if url could not be opened, log error message
	if err != nil || resp.StatusCode != 200 {
		fmt.Println("err:", err)
		return
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Td && n.Parent != nil && n.Parent.Parent != nil && n.Parent.Parent.Parent != nil {
			return scrape.Attr(n.Parent.Parent.Parent, "id") == "coursetable"
		}
		return false
	}

	// find all data rows of courses
	rows := scrape.FindAll(root, matcher)

	course := Course{}

	for i := 0; i < len(rows); {
		v := scrape.Text(rows[i])
		if _, err := strconv.Atoi(v); err == nil && len(v) == 5 {
			// reset course
			course = Course{}

			// next entry for course number
			i++
			v = scrape.Text(rows[i])
			c := strings.Fields(v)
			course.Department = c[0]
			course.CrseNum = c[1]

			// next entry for title
			i++
			v = scrape.Text(rows[i])
			course.Title = v

			// only add course that is not lab, problem, or recitation
			if len(course.CrseNum) == 3 {
				courseTitles, ok := titles[course.Department+" "+course.CrseNum]

				// only add course that have unique titles
				if !ok {
					res = append(res, course)
					titles[course.Department+" "+course.CrseNum] = []string{course.Title}
				} else {
					found := false
					for _, t := range courseTitles {
						if t == course.Title {
							found = true
							break
						}
					}
					if !found {
						res = append(res, course)
						titles[course.Department+" "+course.CrseNum] = append(titles[course.Department+" "+course.CrseNum], course.Title)
					}
				}
			}
		}
		i++
	}
}

func fullTextSearch(l CourseLookup, chIsFinished chan []Course) {
	url := FullTextSearchURL(l)

	// variable that keeps the result
	res := []Course{}

	// inform channel when fetchCourses is done
	defer func() {
		chIsFinished <- res
	}()

	// fetch html content
	resp, _ := http.Get(url)
	root, err := html.Parse(resp.Body)

	// if url could not be opened, log error message
	if err != nil || resp.StatusCode != 200 {
		fmt.Println("err:", err)
		return
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Td {
			return scrape.Attr(n, "class") == "nttitle"
		}
		return false
	}

	// find all data rows of courses
	rows := scrape.FindAll(root, matcher)

	for i := 0; i < len(rows); {
		v := scrape.Text(rows[i])

		course := Course{}

		data := strings.SplitN(v, " - ", 2)
		course.Department = strings.Split(data[0], " ")[0]
		course.CrseNum = strings.Split(data[0], " ")[1]
		course.Title = data[1]
		if len(course.CrseNum) == 3 {
			res = append(res, course)
		}
		i++
	}
}

func checkCourseExist(course Course, chIsFinished chan Course) {
	url := CourseLookupURL(CourseLookup{LookOpt: "CRS", Param1: course.Department, Param2: course.CrseNum})

	// variable that keeps the result
	res := Course{}

	// inform channel when fetchCourses is done
	defer func() {
		chIsFinished <- res
	}()

	// fetch html content
	resp, _ := http.Get(url)
	root, err := html.Parse(resp.Body)

	// if url could not be opened, log error message
	if err != nil || resp.StatusCode != 200 {
		fmt.Println("err:", err)
		return
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Td && n.Parent != nil && n.Parent.Parent != nil && n.Parent.Parent.Parent != nil {
			return scrape.Attr(n.Parent.Parent.Parent, "id") == "coursetable"
		}
		return false
	}

	// find all data rows of courses
	rows := scrape.FindAll(root, matcher)

	for i := 0; i < len(rows); {
		v := strings.TrimSpace(scrape.Text(rows[i]))
		if _, err := strconv.Atoi(v); err == nil && len(v) == 5 {
			// course found
			i += 2
			v = strings.TrimSpace(scrape.Text(rows[i]))

			if v == course.Title {
				res = course
				break
			}
		}
		i++
	}
}

func fetchCourseDetail(subj string, numb string, title string) []CourseDetail {
	// get URL for course description
	descURL := CourseDescURL(subj, numb)

	// fetch html content
	resp, _ := http.Get(descURL)
	root, err := html.Parse(resp.Body)

	// initialize desc and linked courses
	desc := ""
	linked := [][]CourseDetail{}

	if err == nil && resp.StatusCode == 200 {
		// description is the first td tag with class ntdefault
		descMatcher := func(n *html.Node) bool {
			if n.DataAtom == atom.Td && scrape.Attr(n, "class") == "ntdefault" {
				return true
			}
			return false
		}

		descMatch := scrape.FindAll(root, descMatcher)

		// join func that joins description and linked courses with '\n'
		descJoiner := func(s []string) string {
			start := 0
			end := 0

			// go through a loop to find the start and end of the linked course list
			for i := 1; i < len(s); {
				if len(s[i]) >= 12 && s[i][:12] == "Corequisites" {
					start = i
				} else if len(s[i]) >= 13 && s[i][:13] == "Prerequisites" {
					end = i
					break
				}
				i++
			}

			l := ""

			// join all linked courses with '\n'
			if start != 0 && end != 0 {
				l = strings.Join(s[start+1:end], "\n")
			} else if start != 0 {
				l = strings.Join(s[start+1:], "\n")
			}

			return strings.TrimSpace(s[0]) + "\n" + strings.TrimSpace(l)
		}

		if len(descMatch) > 0 {
			// convert the first match to '\n' connected form
			data := strings.Split(scrape.TextJoin(descMatch[0], descJoiner), "\n")
			if len(data) > 0 {
				desc = data[0]
			}
			// only linked courses if the current course is not a lab, problem, or recitation
			if len(numb) == 3 && len(data) > 1 {
				for i := 1; i < len(data); {
					if c := strings.TrimSpace(data[i]); len(c) > 0 {
						if cc := strings.Split(c, " "); len(cc) == 2 {
							// recursively fetch all linked courses
							// TODO: fetch courses using go routine
							lc := fetchCourseDetail(cc[0], cc[1], "")
							if len(lc) > 0 {
								linked = append(linked, fetchCourseDetail(cc[0], cc[1], ""))
							}
						}
					}
					i++
				}
			}
		}
	}

	url := CourseLookupURL(CourseLookup{LookOpt: "CRS", Param1: subj, Param2: numb})

	// variable that keeps the result
	res := []CourseDetail{}

	// fetch html content
	resp, _ = http.Get(url)
	root, err = html.Parse(resp.Body)

	// if url could not be opened, log error message
	if err != nil || resp.StatusCode != 200 {
		fmt.Println("err:", err)
		return []CourseDetail{}
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Td && n.Parent != nil && n.Parent.Parent != nil && n.Parent.Parent.Parent != nil {
			return scrape.Attr(n.Parent.Parent.Parent, "id") == "coursetable"
		}
		return false
	}

	// find all data rows of courses
	rows := scrape.FindAll(root, matcher)

	course := CourseDetail{}

	for i := 0; i < len(rows); {
		v := strings.TrimSpace(scrape.Text(rows[i]))
		if _, err := strconv.Atoi(v); err == nil && len(v) == 5 {
			// reset course
			course = CourseDetail{}
			course.Desc = desc
			course.CRN = v

			// next entry for course number
			i++
			v = scrape.Text(rows[i])
			c := strings.Fields(v)
			course.Department = c[0]
			course.CrseNum = c[1]
			course.Section = c[2]

			// next entry for title
			i++
			v = strings.TrimSpace(scrape.Text(rows[i]))
			course.Title = v

			// next entry for time
			i++
			joiner := func(s []string) string {
				n := 0
				for i := range s {
					trimmed := strings.TrimSpace(s[i])
					if trimmed != "" {
						s[n] = trimmed
						n++
					}
				}
				return strings.Join(s[:n], "\n")
			}
			v = strings.TrimSpace(scrape.TextJoin(rows[i], joiner))
			course.Time = v

			// next entry for room
			i++
			v = strings.TrimSpace(scrape.Text(rows[i]))
			course.Room = v

			// next entry for instructor
			i++
			v = strings.TrimSpace(scrape.Text(rows[i]))
			course.Instructor = v

			// next entry for seats
			i++
			v = strings.TrimSpace(scrape.Text(rows[i]))
			course.Seats = v

			// skip waitlist and reserved seats for permission
			i += 3
			v = strings.TrimSpace(scrape.Text(rows[i]))
			course.Prm = v

			// next entry for CCC
			i++
			v = scrape.Text(rows[i])
			course.CCCReq = strings.Fields(v)

			// skip desc and guide for notes
			i += 4
			if i < len(rows) {
				v = strings.TrimSpace(scrape.Text(rows[i]))
				if len(v) != 0 && string(v[0]) == "S" {
					course.Notes = v
				}
			}
			i--

			course.Linked = linked

			// Only add exact match sections
			if course.CrseNum == numb && (len(title) == 0 || title == course.Title) {
				res = append(res, course)
			}
		}
		i++
	}

	return res
}

// SearchCourses fetches basic course info for search autocomplete
// Return type: array of Course type (Department, CrseNum, Title)
func SearchCourses(w http.ResponseWriter, r *http.Request) {
	query := strings.Fields(mux.Vars(r)["query"])

	department := ""
	crseNum := ""

	if len(query) > 0 {
		department = strings.ToUpper(query[0])
	}
	if len(query) > 1 {
		crseNum = query[1]
	}

	courses := []Course{}

	if len(crseNum) == 0 && len(department) == 4 {
		// lookup courses in the department from 0xx to 6xx and for CCC requirement concurrently
		chIsFinished := make(chan []Course)

		for i := 0; i < 7; {
			// fetch department courses ixx
			go fetchCourses(CourseLookup{LookOpt: "CRS", Param1: department, Param2: strconv.Itoa(i)}, chIsFinished)
			i++
		}

		// fetch courses for CCC requirement
		go fetchCourses(CourseLookup{LookOpt: "REQ2", Param1: department}, chIsFinished)

		courses = []Course{}
		for i := 0; i < 8; {
			c := <-chIsFinished
			courses = append(courses, c...)
			i++
		}

	} else if _, err := strconv.Atoi(crseNum); err == nil && len(department) == 4 {
		// fetch courses by department and course number
		chIsFinished := make(chan []Course)

		go fetchCourses(CourseLookup{LookOpt: "CRS", Param1: department, Param2: crseNum}, chIsFinished)
		courses = <-chIsFinished

	}

	if len(courses) == 0 && len(strings.Join(query, "")) > 1 {
		// do a full text search in course titles no matches were found
		chIsFinished := make(chan []Course)

		for _, d := range DepartmentList {
			// search for title in departments concurrently
			go fullTextSearch(CourseLookup{LookOpt: "FTS", Param1: d, Param2: strings.Join(query, " ")}, chIsFinished)
		}

		res := []Course{}
		for i := 0; i < len(DepartmentList); {
			c := <-chIsFinished
			res = append(res, c...)
			i++
		}

		chIsChecked := make(chan Course)
		// check if the course exist concurrently
		for _, c := range res {
			go checkCourseExist(c, chIsChecked)
		}

		for i := 0; i < len(res); {
			c := <-chIsChecked
			if len(c.Department) > 0 && len(c.CrseNum) > 0 && len(c.Title) > 0 {
				courses = append(courses, c)
			}
			i++
		}

		json.NewEncoder(w).Encode(courses)

	} else {
		json.NewEncoder(w).Encode(courses)
	}
}

// GetCourse fetches detail course info based on department, course number, and title
// Return type: array of CourseDetail type
func GetCourse(w http.ResponseWriter, r *http.Request) {
	v := mux.Vars(r)
	subj := strings.ToUpper(v["dept"])
	numb := v["crseNum"]
	title := v["title"]

	courses := fetchCourseDetail(subj, numb, title)
	json.NewEncoder(w).Encode(courses)
}

// Welcome prints a welcome message and simple instructions for using this API
func Welcome(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome to AntSchedule API! \nPlease use /searchCourses/{query} for course autocomplete and courseDetail/{dept}/{crseNum}/[{title}] for fetching course details.")
}

func main() {
	port := os.Getenv("PORT")

	if port == "" {
		// log.Fatal("$PORT must be set")
		// for development
		port = "8080"
	}

	router := mux.NewRouter()
	handler := cors.Default().Handler(router)
	router.HandleFunc("/", Welcome).Methods("GET")
	router.HandleFunc("/searchCourses/{query}", SearchCourses).Methods("GET")
	router.HandleFunc("/courseDetail/{dept}/{crseNum}", GetCourse).Methods("GET")
	router.HandleFunc("/courseDetail/{dept}/{crseNum}/{title}", GetCourse).Methods("GET")
	router.HandleFunc("/searchCourses/", SearchCourses).Methods("GET")
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// DepartmentList for course search
var DepartmentList = []string{
	"ACFM",
	"AFST",
	"ANBE",
	"ANTH",
	"ARBC",
	"ARTH",
	"ARST",
	"ASTR",
	"BIOL",
	"BMEG",
	"CHEG",
	"CHEM",
	"CHIN",
	"CEEG",
	"CLAS",
	"CSCI",
	"ENCW",
	"DANC",
	"EAST",
	"ECON",
	"EDUC",
	"ECEG",
	"ENGR",
	"ENGL",
	"ENST",
	"ENFS",
	"FOUN",
	"FREN",
	"GEOG",
	"GEOL",
	"GRMN",
	"GLBM",
	"GREK",
	"HEBR",
	"HIST",
	"HUMN",
	"IDPT",
	"IREL",
	"ITAL",
	"JAPN",
	"LATN",
	"LAMS",
	"LEGL",
	"LING",
	"ENLS",
	"MGMT",
	"MSUS",
	"MIDE",
	"MATH",
	"MECH",
	"MILS",
	"MUSC",
	"NEUR",
	"PHIL",
	"PHYS",
	"POLS",
	"PYSC",
	"RELI",
	"RESC",
	"RUSS",
	"SIGN",
	"SOCI",
	"SPAN",
	"THEA",
	"UNIV",
	"WMST",
}
