import { ArrowUpRight } from "lucide-react";
import { Heading } from "./learning";
import { hldCompanies, hldConcepts, hldFramework, hldQuestions, hldStudyOrder } from "./study/maang-hld";
import { studyTopics } from "./study";

const sections = [
  { id: "questions", label: "Questions" },
  { id: "concepts", label: "Core concepts" },
  { id: "companies", label: "Company prep" },
  { id: "study-order", label: "Study order" },
  { id: "framework", label: "Answer framework" },
] as const;

function QuestionList({ start, end, title }: { start: number; end: number; title: string }) {
  return (
    <section className="panel reading-card hld-section">
      <h2>{title}</h2>
      <ol className="hld-questions" start={start}>
        {hldQuestions.slice(start - 1, end).map(({ title, focus, problem, related }) => (
          <li key={title}>
            <div className="hld-question-content">
              <div>
                <h3>{title}</h3>
                <p>{focus}</p>
                {related && <a className="text-link" href={`#answer/${related.problem}`}>{related.title}</a>}
              </div>
              <a className="button neutral" href={`#answer/${problem}`} aria-label={`Worked answer for ${title}`}>
                Worked answer <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MaangHldCourse({ sectionId }: { sectionId?: string }) {
  const selected = sections.find(({ id }) => id === sectionId) ?? sections[0];

  return (
    <>
      <Heading title="MAANG HLD Interview Prep" description="30 system design questions and 20 core concepts for SDE-2 and senior interviews." />
      <nav className="filters hld-nav" aria-label="MAANG HLD course sections">
        {sections.map(({ id, label }) => (
          <a key={id} className={`filter ${id === selected.id ? "selected" : ""}`}
            aria-current={id === selected.id ? "page" : undefined} href={`#maang-hld/${id}`}>{label}</a>
        ))}
      </nav>

      {selected.id === "questions" && (
        <>
          <QuestionList start={1} end={12} title="12 must-prepare questions" />
          <QuestionList start={13} end={hldQuestions.length} title="18 more interview questions" />
        </>
      )}

      {selected.id === "concepts" && (
        <section className="study-category">
          <h2>20 core HLD concepts</h2>
          <ul className="panel study-entries">
            {hldConcepts.map(({ title, topic }) => (
              <li key={topic}>
                <a href={`#study-topic/${topic}`}>
                  <strong>{title}</strong>
                  <span>{studyTopics.find(({ id }) => id === topic)?.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected.id === "companies" && (
        <section className="panel reading-card hld-section">
          <h2>Practice by company</h2>
          <div className="hld-companies">
            {hldCompanies.map(({ name, focus, examples }) => (
              <section key={name}>
                <h3>{name}</h3>
                <p>{focus}</p>
                <ul>
                  {examples.map(({ title, problem }) => (
                    <li key={problem}><a className="text-link" href={`#answer/${problem}`}>{title}</a></li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      )}

      {selected.id === "study-order" && (
        <section className="panel reading-card hld-section">
          <h2>Recommended study order</h2>
          <p>For each question, draw a first pass, trace one important request, then compare with the worked answer. Finish by explaining one failure aloud.</p>
          <ol className="hld-sequence">
            {hldStudyOrder.map((number) => {
              const { title, problem, focus } = hldQuestions[number - 1];
              return <li key={number}><a className="text-link" href={`#answer/${problem}`}>{title}</a><p>{focus}</p></li>;
            })}
          </ol>
        </section>
      )}

      {selected.id === "framework" && (
        <section className="panel reading-card hld-section">
          <h2>How to answer any HLD question</h2>
          <ol className="hld-sequence">
            {hldFramework.map(({ title, method }) => (
              <li key={title}><h3>{title}</h3><p>{method}</p></li>
            ))}
          </ol>
          <a className="text-link" href="#answer/event-tickets">Walk through a complete example with ticket booking</a>
        </section>
      )}
    </>
  );
}
