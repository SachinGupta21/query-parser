use query_parser;

create table tokens(
f_id int AUTO_INCREMENT UNIQUE,
f_token varchar(50),
f_type varchar(50),
f_url varchar(100),
f_port int,
f_username varchar(100),
f_password varchar(100),
f_database varchar(100)
);