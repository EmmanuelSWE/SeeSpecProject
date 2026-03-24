export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="card prose-card">
        <div className="card-body">
          <h1>About</h1>
          <p>
            This is a simple startup template based on ASP.NET Boilerplate framework and Module Zero. If you need
            an enterprise startup project, check <a href="http://aspnetzero.com?ref=abptmpl">ASP.NET ZERO</a>.
          </p>
          <h3>What is ASP.NET Boilerplate?</h3>
          <p>
            ASP.NET Boilerplate is an application framework built on latest <strong>ASP.NET Core</strong> framework.
            It makes easy to use authorization, dependency injection, validation, exception handling, localization,
            logging, caching, background jobs and so on.
          </p>
          <p>
            ASP.NET Boilerplate implements <strong>NLayer architecture</strong> and <strong>Domain Driven Design</strong>.
            It also provides a good infrastructure to implement common software development best practices.
          </p>
          <h3>What is Module Zero?</h3>
          <p>
            ASP.NET Boilerplate framework is designed to be independent of any database schema and to be as generic as
            possible. Therefore, it leaves some concepts abstract and optional which require some data store.
          </p>
          <p>
            <strong>Module Zero</strong> implements all fundamental concepts of ASP.NET Boilerplate framework such as
            tenant management, role management, user management, authorization, permission management, setting
            management, language management and audit logging.
          </p>
          <p>
            Module Zero defines entities and implements <strong>domain logic</strong> while leaving application and
            presentation layers to you.
          </p>
          <h4>Based on Microsoft ASP.NET Core Identity</h4>
          <p>
            Module Zero is based on Microsoft&apos;s ASP.NET Core Identity library. It extends user and role managers
            and implements user and role stores using generic repositories.
          </p>
          <h3>Documentation</h3>
          <ul>
            <li>
              <a href="https://www.aspnetboilerplate.com/Pages/Documents/Zero/Startup-Template-Core">
                Documentation for this template
              </a>
            </li>
            <li>
              <a href="http://www.aspnetboilerplate.com/Pages/Documents">ASP.NET Boilerplate documentation</a>
            </li>
          </ul>
          <h3>Source code</h3>
          <p>
            This template is developed open source on Github. You can contribute to the template.
            <a href="https://github.com/aspnetboilerplate/module-zero-core-template">
              {" "}https://github.com/aspnetboilerplate/module-zero-core-template
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
