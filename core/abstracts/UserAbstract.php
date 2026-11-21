<?php
declare(strict_types=1);

abstract class UserAbstract
{
    protected string $nama;
    protected string $email;
    protected string $peran;

    public function __construct(string $nama, string $email, string $peran)
    {
        $this->nama = trim($nama);
        $this->email = strtolower(trim($email));
        $this->peran = $peran;
    }

    public function getNama(): string
    {
        return $this->nama;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPeran(): string
    {
        return $this->peran;
    }

    abstract public function getIdentitasRingkas(): string;
}
