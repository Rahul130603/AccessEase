/**
 * AccessibleField — labelled form controls, hints and error messages.
 *
 * Public entry point for features 5 (accessible form labels) and 8 (accessible error
 * messages). The implementation lives in `patterns/`, where it is shared with the
 * audit and the authentication examples; this file is the stable path the requested
 * module structure exposes, and it re-exports rather than re-implements, so there is
 * exactly one copy of the logic.
 *
 * What the components guarantee
 * -----------------------------
 *  - A real `<label for>` (or a wrapping label) is the mechanism; ARIA is only used
 *    where HTML cannot express the relationship.
 *  - Hints and errors are associated with `aria-describedby`, and a field with an
 *    error gets `aria-invalid="true"`.
 *  - Error text is real text with a visible "Error: " prefix and a dashed border as a
 *    second signal — never colour alone — and the wording says what to do.
 *  - `useFormErrors()` + `<FormErrorSummary />` give a form-level summary that is
 *    focused once on a failed submission, which is why no live region is needed and
 *    nothing is announced twice.
 *
 * @example
 * import { TextField, FormErrorSummary, useFormErrors } from './accessibility/AccessibleField';
 *
 * function SignUp() {
 *   const form = useFormErrors();
 *   const [email, setEmail] = useState('');
 *   return (
 *     <form onSubmit={(event) => { event.preventDefault(); form.handleFailure(validate(email)); }}>
 *       <FormErrorSummary form={form} />
 *       <TextField label="Email address" type="email" autoComplete="email" required
 *                  value={email} error={form.errors.email}
 *                  onChange={(next) => { setEmail(next); form.clear('email'); }} />
 *       <button type="submit">Create account</button>
 *     </form>
 *   );
 * }
 */

export {
  default as Field,
  FieldError,
  FieldHint,
  useField,
  useFieldErrorAnnouncement,
} from './patterns/FormField.jsx';

export {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioGroupField,
} from './patterns/fields.jsx';

export { default as FormErrorSummary, useFormErrors } from './patterns/FormErrorSummary.jsx';
