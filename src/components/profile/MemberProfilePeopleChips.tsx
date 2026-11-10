import { Link } from 'react-router-dom';
import { memberProfileLink } from '../../config/routingCatalog';
import { SecureAvatar } from '../ui/SecureAvatar';

type PersonChip = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type MemberProfilePeopleChipsProps = {
  people: PersonChip[];
  emptyLabel?: string;
};

export const MemberProfilePeopleChips = ({ people, emptyLabel }: MemberProfilePeopleChipsProps) => {
  if (people.length === 0) {
    return emptyLabel ? <p className="text-sm text-neutral-500">{emptyLabel}</p> : null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {people.map((person) => (
        <li key={person.userId}>
          <Link
            to={memberProfileLink(person.userId)}
            className="inline-flex max-w-[11rem] items-center gap-2 rounded-full border border-neutral-200/90 bg-white py-1 pe-3 ps-1 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
          >
            <SecureAvatar
              src={person.avatarUrl}
              name={person.displayName}
              className="h-8 w-8 shrink-0 text-xs"
            />
            <span className="truncate text-sm font-semibold text-neutral-900">{person.displayName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
