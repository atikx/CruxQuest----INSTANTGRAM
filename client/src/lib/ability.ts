import { AbilityBuilder, createMongoAbility } from "@casl/ability";

export interface UserInterface {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string;
  isEmailVerified: boolean;
}

const defineAbilityFor = (user: UserInterface) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  
 if (user.isEmailVerified) {
    can("read", "all"); 
    can("like", "post");
    can("comment", "post");
    can("create", "comment"); 
    can("create", "post"); 
    can("send", "friendRequest"); 
    can("accept", "friendRequest"); 
    can("reject", "friendRequest"); 
  } else {
    can("read", "post"); // read-only access to posts
  }

  return build();
};

export { defineAbilityFor };